/**
 * EEG101 Resources API Endpoint
 *
 * GET /api/resources
 *
 * Query parameters:
 * - collection: Collection key(s), comma-separated (e.g., 'F9DNTXQA,ZD2RV8H9,L72L5WAP') [required]
 * - family: Filter by family ('bibliographic', 'multimedia', 'technical', 'webpage') [optional]
 * - page: Page number for pagination (default: 1) [optional]
 * - perPage: Items per page (default: 20, max: 100) [optional]
 * - format: 'card' or 'detail' (default: 'card') [optional]
 */

import { NextResponse } from "next/server";
import {
  fetchItemsFromCollection,
  fetchCollections,
  getCollectionPath,
  getSubcollectionsForParts,
} from "@/lib/zotero/client";
import {
  transformItem,
  groupByFamily,
  getResourceStats,
  prepareForCard,
  prepareForDetail,
} from "@/lib/zotero/transform";

// Deduplicate and merge manifestoPart arrays for resources with the same id
function deduplicateResources(resources) {
  const map = new Map();

  resources.forEach((res) => {
    const id = res.id;
    const parts = Array.isArray(res.manifestoPart)
      ? res.manifestoPart
      : res.manifestoPart
      ? [res.manifestoPart]
      : [];

    if (!map.has(id)) {
      map.set(id, { ...res, manifestoPart: parts });
    } else {
      const existing = map.get(id);
      const mergedParts = Array.from(
        new Set([...existing.manifestoPart, ...parts])
      );
      map.set(id, { ...existing, ...res, manifestoPart: mergedParts });
    }
  });

  return Array.from(map.values());
}

export async function GET(request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const collectionParam = searchParams.get("collection");
    const familyFilter = searchParams.get("family");
    const format = searchParams.get("format") || "card"; // 'card' or 'detail'
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("perPage") || "20", 10))
    );

    // Validate parameters
    if (!collectionParam) {
      return NextResponse.json(
        { error: "Missing required parameter: collection" },
        { status: 400 }
      );
    }

    if (
      familyFilter &&
      !["bibliographic", "multimedia", "technical", "webpage"].includes(
        familyFilter
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid family. Must be: bibliographic, multimedia, technical, or webpage",
        },
        { status: 400 }
      );
    }

    // Support multiple collections (comma-separated)
    const collectionKeys = collectionParam.split(",").map((k) => k.trim());

    // Get collection info to include the name in transformed items
    let collectionMap = {};
    let collectionNames = {};
    try {
      const allCollections = await fetchCollections();
      allCollections.forEach((collection) => {
        collectionMap[collection.key] = collection;
      });
      collectionKeys.forEach((key) => {
        const collection = collectionMap[key];
        if (collection) collectionNames[key] = collection.name;
      });
    } catch (error) {
      console.warn("Could not fetch collection info:", error.message);
    }

    // Get subcollections for the requested collections (if they are Part collections)
    let subcollectionsMap = {};
    try {
      // Only get subcollections if the requested keys are the main Parts
      const mainPartKeys = collectionKeys.filter((key) =>
        ["F9DNTXQA", "ZD2RV8H9", "L72L5WAP"].includes(key)
      );
      if (mainPartKeys.length > 0) {
        subcollectionsMap = await getSubcollectionsForParts(mainPartKeys);
      }
    } catch (error) {
      console.warn("Could not fetch subcollections:", error.message);
    }

    // Build a list of all collection keys to fetch from (requested + subcollections)
    const allCollectionKeysToFetch = [
      ...collectionKeys,
      ...Object.values(subcollectionsMap)
        .flat()
        .map((sub) => sub.key),
    ];

    // Fetch and transform items from all collections in parallel
    const allResources = (
      await Promise.all(
        allCollectionKeysToFetch.map(async (collectionKey) => {
          const rawItems = await fetchItemsFromCollection(collectionKey, {
            limit: 10000, // Fetch all items per collection
          });

          // For each item, get its full collection path (including subcollections)
          const resourcesWithPaths = await Promise.all(
            rawItems.map(async (rawItem) => {
              const collectionPath = await getCollectionPath(
                rawItem.key,
                collectionMap,
                ["F9DNTXQA", "ZD2RV8H9", "L72L5WAP"]
              );

              // If we got a collection path, use it; otherwise use the current collection name
              const manifestoPart =
                collectionPath.length > 0
                  ? collectionPath
                  : collectionMap[collectionKey]?.name || "";

              return transformItem(rawItem, {
                collectionName: manifestoPart,
                collectionKey,
              });
            })
          );

          return resourcesWithPaths;
        })
      )
    ).flat();

    // Deduplicate and merge manifestoPart arrays
    let resources = deduplicateResources(allResources);

    // Filter by family if specified
    if (familyFilter) {
      resources = resources.filter((r) => r.family === familyFilter);
    }

    // Pagination
    const total = resources.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pagedResources = resources.slice(start, end);

    // Format resources based on requested format
    const formattedResources =
      format === "card"
        ? pagedResources.map(prepareForCard)
        : pagedResources.map(prepareForDetail);

    // Get statistics
    const stats = getResourceStats(resources);
    const grouped = groupByFamily(resources);

    // Return response
    return NextResponse.json({
      success: true,
      data: formattedResources,
      meta: {
        total,
        page,
        perPage,
        totalPages,
        collections: collectionKeys.map((key) => ({
          key,
          name: collectionNames[key] || "",
        })),
        familyFilter: familyFilter || null,
        format,
        stats,
        countByFamily: {
          bibliographic: grouped.bibliographic.length,
          multimedia: grouped.multimedia.length,
          technical: grouped.technical.length,
          webpage: grouped.webpage.length,
        },
      },
    });
  } catch (error) {
    console.error("Resources API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch resources",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
