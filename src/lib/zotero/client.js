/**
 * Zotero API Client
 *
 * This file handles all communication with the Zotero API.
 * It reads credentials from environment variables and provides
 * simple functions to fetch collections and items.
 */

import api from "zotero-api-client";

/**
 * Get Zotero API configuration from environment variables
 *
 * Environment variables needed:
 * - ZOTERO_KEY: Your Zotero API key
 * - ZOTERO_LIBRARY_TYPE: Either 'user' or 'group'
 * - ZOTERO_LIBRARY_ID: Your library ID (user ID or group ID)
 */
function getZoteroConfig() {
  const key = process.env.ZOTERO_KEY?.trim();
  const libraryType = process.env.ZOTERO_LIBRARY_TYPE?.trim() || "group";
  const libraryId = process.env.ZOTERO_LIBRARY_ID?.trim();

  if (!key || !libraryId) {
    throw new Error(
      "Missing Zotero credentials. Please set ZOTERO_KEY and ZOTERO_LIBRARY_ID in .env.local"
    );
  }

  return { key, libraryType, libraryId };
}

/**
 * Create a Zotero API client instance
 *
 * This creates the connection to your Zotero library.
 * It uses the credentials from .env.local file.
 *
 * @returns {Object} Zotero API client configured for your library
 */
function createZoteroClient() {
  const { key, libraryType, libraryId } = getZoteroConfig();

  // Handle different export formats of zotero-api-client
  const zoteroApi = api.default || api;

  return zoteroApi(key).library(libraryType, libraryId);
}

/**
 * Fetch all collections from the Zotero library
 *
 * Collections are folders in Zotero (like "Part 1: Validity", "Part 2: Democratization").
 *
 * @returns {Promise<Array>} Array of collection objects with { key, name, parentCollection }
 *
 * Example return:
 * [
 *   { key: 'ASWVI2UU', name: 'Part 1: Validity', parentCollection: null },
 *   { key: 'F9DNTXQA', name: 'Part 2: Democratization', parentCollection: null }
 * ]
 */
export async function fetchCollections() {
  try {
    const library = createZoteroClient();
    const response = await library.collections().get();

    // Extract just the data we need
    // Handle both response formats (some have data nested, some don't)
    return response.getData().map((collection) => ({
      key: collection.key || collection.data?.key,
      name: collection.data?.name || collection.name,
      parentCollection:
        collection.data?.parentCollection ||
        collection.parentCollection ||
        null,
      numItems: collection.meta?.numItems || 0,
    }));
  } catch (error) {
    console.error("Error fetching collections:", error.message);
    throw new Error(`Failed to fetch collections: ${error.message}`);
  }
}

/**
 * Fetch all items from a specific collection
 *
 * @param {string} collectionKey - The key of the collection (e.g., 'ASWVI2UU')
 * @param {Object} options - Optional parameters
 * @param {number} options.limit - Maximum number of items to fetch (default: 100)
 * @returns {Promise<Array>} Array of raw Zotero item objects
 *
 * Example usage:
 * const items = await fetchItemsFromCollection('ASWVI2UU');
 * const limitedItems = await fetchItemsFromCollection('ASWVI2UU', { limit: 50 });
 */
export async function fetchItemsFromCollection(collectionKey, options = {}) {
  try {
    const library = createZoteroClient();
    const { limit = 100 } = options;

    // Fetch all items by making multiple requests if needed
    let allItems = [];
    let start = 0;
    const batchSize = 100; // Zotero API limit per request

    while (true) {
      const response = await library
        .collections(collectionKey)
        .items()
        .top() // Only get top-level items (not attachments/notes)
        .get({ limit: batchSize, start });

      const items = response.getData();
      allItems = allItems.concat(items);

      // Check if we've fetched all items or reached the requested limit
      if (items.length < batchSize || allItems.length >= limit) {
        break;
      }

      start += batchSize;
    }

    return allItems.slice(0, limit);
  } catch (error) {
    console.error(
      `Error fetching items from collection ${collectionKey}:`,
      error.message
    );
    throw new Error(`Failed to fetch items from collection: ${error.message}`);
  }
}

/**
 * Fetch all top-level items from the entire library
 * (not filtered by collection)
 *
 * @param {Object} options - Optional parameters
 * @param {number} options.limit - Maximum number of items to fetch (default: 100)
 * @returns {Promise<Array>} Array of raw Zotero item objects
 */
export async function fetchAllItems(options = {}) {
  try {
    const library = createZoteroClient();
    const { limit = 100 } = options;

    const response = await library
      .items()
      .top() // Only get top-level items (not attachments/notes)
      .get({ limit });

    return response.getData();
  } catch (error) {
    console.error("Error fetching all items:", error.message);
    throw new Error(`Failed to fetch all items: ${error.message}`);
  }
}

/**
 * Fetch a single item by its key
 *
 * @param {string} itemKey - The key of the item
 * @returns {Promise<Object>} The raw Zotero item object
 */
export async function fetchItem(itemKey) {
  try {
    const library = createZoteroClient();
    const response = await library.items(itemKey).get();
    return response.getData();
  } catch (error) {
    console.error(`Error fetching item ${itemKey}:`, error.message);
    throw new Error(`Failed to fetch item: ${error.message}`);
  }
}

/**
 * Fetch collections that contain a specific item
 *
 * @param {string} itemKey - The key of the item
 * @returns {Promise<Array>} Array of collection objects
 */
export async function fetchItemCollections(itemKey) {
  try {
    const library = createZoteroClient();
    const item = await library.items(itemKey).get();
    const itemData = item.getData();

    // Get collection keys from the item
    const collectionKeys = itemData.collections || [];

    if (collectionKeys.length === 0) {
      return [];
    }

    // Fetch all collections to get their names
    const allCollections = await fetchCollections();

    // Filter to only the collections this item belongs to
    return allCollections.filter((c) => collectionKeys.includes(c.key));
  } catch (error) {
    console.error(
      `Error fetching collections for item ${itemKey}:`,
      error.message
    );
    return []; // Return empty array on error
  }
}

/**
 * Search items by query string
 *
 * @param {string} query - Search query
 * @param {Object} options - Optional parameters
 * @param {number} options.limit - Maximum number of items to fetch (default: 50)
 * @returns {Promise<Array>} Array of raw Zotero item objects matching the query
 */
export async function searchItems(query, options = {}) {
  try {
    const library = createZoteroClient();
    const { limit = 50 } = options;

    const response = await library.items().top().get({ q: query, limit });

    return response.getData();
  } catch (error) {
    console.error(
      `Error searching items with query "${query}":`,
      error.message
    );
    throw new Error(`Failed to search items: ${error.message}`);
  }
}

/**
 * Get subcollections for the three main Part collections
 *
 * This fetches all collections and filters to only include subcollections
 * that are nested directly under the three hardcoded Part collections
 * (F9DNTXQA, ZD2RV8H9, L72L5WAP).
 *
 * @param {Array<string>} partKeys - The keys of the three Part collections
 * @returns {Promise<Object>} Map of part key to array of subcollections
 *   Example: {
 *     'F9DNTXQA': [
 *       { key: 'ABC123', name: 'Epistemology' },
 *       { key: 'XYZ789', name: 'Ethics' }
 *     ]
 *   }
 */
export async function getSubcollectionsForParts(partKeys) {
  try {
    const allCollections = await fetchCollections();
    const subcollectionsMap = {};

    // Initialize map for each part
    partKeys.forEach((key) => {
      subcollectionsMap[key] = [];
    });

    // Filter collections to only those that are subcollections of the parts
    allCollections.forEach((collection) => {
      if (partKeys.includes(collection.parentCollection)) {
        if (!subcollectionsMap[collection.parentCollection]) {
          subcollectionsMap[collection.parentCollection] = [];
        }
        subcollectionsMap[collection.parentCollection].push({
          key: collection.key,
          name: collection.name,
          parentCollection: collection.parentCollection,
        });
      }
    });

    return subcollectionsMap;
  } catch (error) {
    console.error("Error getting subcollections for parts:", error.message);
    return {};
  }
}

/**
 * Get the full collection path for an item
 *
 * This builds an array of collection names from parent to child.
 * For example, if an item is in "Epistemology" which is under "Part 1: Validity",
 * it returns ['Part 1: Validity', 'Epistemology'].
 *
 * Only includes collections that are under the three main Parts (F9DNTXQA, ZD2RV8H9, L72L5WAP).
 *
 * @param {string} itemKey - The key of the item
 * @param {Object} collectionMap - All collections keyed by key
 * @param {Array<string>} partKeys - The keys of the three Part collections
 * @returns {Promise<Array<string>>} Array of collection names from parent to child
 */
export async function getCollectionPath(itemKey, collectionMap, partKeys) {
  try {
    // Get all collections this item belongs to
    const itemCollections = await fetchItemCollections(itemKey);

    if (itemCollections.length === 0) {
      return [];
    }

    // Find the collection that is either a Part or a subcollection of a Part
    const relevantCollection = itemCollections.find((collection) => {
      return (
        partKeys.includes(collection.key) ||
        partKeys.includes(collection.parentCollection)
      );
    });

    if (!relevantCollection) {
      return [];
    }

    // Build the path from parent to child
    const path = [];

    // If this collection is a subcollection, add its parent (the Part)
    if (relevantCollection.parentCollection) {
      const parentKey = relevantCollection.parentCollection;
      const parentCollection = collectionMap[parentKey];
      if (parentCollection) {
        path.push(parentCollection.name);
      }
    }

    // Add the collection itself
    path.push(relevantCollection.name);

    return path;
  } catch (error) {
    console.error(
      `Error getting collection path for item ${itemKey}:`,
      error.message
    );
    return [];
  }
}

/**
 * Get the collection path for an item using data already in the item object
 *
 * This is the optimized version - it doesn't make API calls.
 * Uses the item's collections array (from item.data.collections) and the collection map
 * to build the path, avoiding the need to fetch collections per-item.
 *
 * @param {Object} rawItem - The raw Zotero item object with data.collections array
 * @param {Object} collectionMap - All collections keyed by key (from fetchCollections)
 * @param {Array<string>} partKeys - The keys of the three Part collections
 * @returns {Array<string>} Array of collection names from parent to child
 */
export function getCollectionPathFromItemData(
  rawItem,
  collectionMap,
  partKeys
) {
  try {
    // Get collection keys from the item's data
    const itemData = rawItem.data || rawItem;
    const collectionKeys = itemData.collections || [];

    if (collectionKeys.length === 0) {
      return [];
    }

    // Find a collection that is either a Part or a subcollection of a Part
    const relevantCollectionKey = collectionKeys.find((key) => {
      const collection = collectionMap[key];
      if (!collection) return false;

      return (
        partKeys.includes(key) || partKeys.includes(collection.parentCollection)
      );
    });

    if (!relevantCollectionKey) {
      return [];
    }

    const relevantCollection = collectionMap[relevantCollectionKey];
    if (!relevantCollection) {
      return [];
    }

    // Build the path from parent to child
    const path = [];

    // If this collection is a subcollection, add its parent (the Part)
    if (relevantCollection.parentCollection) {
      const parentKey = relevantCollection.parentCollection;
      const parentCollection = collectionMap[parentKey];
      if (parentCollection) {
        path.push(parentCollection.name);
      }
    }

    // Add the collection itself
    path.push(relevantCollection.name);

    return path;
  } catch (error) {
    console.error("Error getting collection path from item data:", error.message);
    return [];
  }
}
