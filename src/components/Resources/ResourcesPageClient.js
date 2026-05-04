"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import SearchBar from "@/components/ui/SearchBar";
import { FilterSidebar } from "./FilterSidebar";
import { ResourceCard } from "./ResourceCard";
import { matchesFilters } from "@/lib/filterUtils";

function filterResources(resources, activeFilters) {
  return resources.filter((resource) =>
    matchesFilters(resource, activeFilters),
  );
}

export function ResourcesPageClient({ initialResources }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // All sections available in the dataset (for legacy ?section= alias resolution)
  const allSections = useMemo(
    () =>
      Array.from(
        new Set(
          initialResources.flatMap((r) =>
            Array.isArray(r.manifestoPart)
              ? r.manifestoPart
              : r.manifestoPart
                ? [r.manifestoPart]
                : []
          )
        )
      ),
    [initialResources]
  );

  // Derive activeFilters directly from URL — URL is the single source of truth.
  // This ensures navigating to any ?tag=, ?type=, ?frameworkSection=, ?language= URL
  // always produces the correct filter state without accumulation or stale refs.
  const activeFilters = useMemo(() => {
    const frameworkSectionsFromUrl = searchParams.getAll("frameworkSection");
    const legacySection = searchParams.get("section");

    let resolvedSections = frameworkSectionsFromUrl;
    if (frameworkSectionsFromUrl.length === 0 && legacySection) {
      const aliasToPattern = {
        part1: /^Part\s*1\b/i,
        part2: /^Part\s*2\b/i,
        part3: /^Part\s*3\b/i,
      };
      const pattern = aliasToPattern[legacySection.toLowerCase()];
      if (pattern) {
        resolvedSections = allSections.filter((s) => pattern.test(s));
      }
    }

    return {
      frameworkSections: resolvedSections,
      types: searchParams.getAll("type"),
      languages: searchParams.getAll("language"),
      tags: searchParams.getAll("tag").map((t) => decodeURIComponent(t)),
    };
  }, [searchParams, allSections]);

  // Search query kept in local state for responsive typing; synced from URL on navigation.
  const [searchQuery, setSearchQuery] = useState(
    () => decodeURIComponent(searchParams.get("search") || "")
  );
  useEffect(() => {
    setSearchQuery(decodeURIComponent(searchParams.get("search") || ""));
  }, [searchParams]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Build URLSearchParams from a filter object, preserving the current search query.
  const buildParams = useCallback(
    (newFilters) => {
      const params = new URLSearchParams();
      const currentSearch = searchParams.get("search");
      if (currentSearch) params.set("search", currentSearch);
      (newFilters.frameworkSections || []).forEach((s) =>
        params.append("frameworkSection", s)
      );
      (newFilters.types || []).forEach((t) => params.append("type", t));
      (newFilters.languages || []).forEach((l) => params.append("language", l));
      (newFilters.tags || []).forEach((tag) =>
        params.append("tag", encodeURIComponent(tag))
      );
      return params.toString();
    },
    [searchParams]
  );

  // Push new filter state to URL instead of updating React state directly.
  const handleFilterChange = useCallback(
    (newFilters) => {
      const qs = buildParams(newFilters);
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, buildParams]
  );

  // Clear all filters AND the search query.
  // Reset local search state immediately (the URL may already have no params,
  // so router.push alone wouldn't trigger the searchParams useEffect).
  const handleClearAllFilters = useCallback(() => {
    setSearchQuery("");
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  // Force refresh data from Zotero
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/revalidate", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        // Refresh the page to get new data
        router.refresh();
        // Reload the page once refresh is complete
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        console.error("Revalidation failed:", data.error);
      }
    } catch (error) {
      console.error("Failed to refresh:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [router]);

  // Resources matched by search text only — used for sidebar counts so that
  // typing in the search box updates the counts without being distorted by
  // the active facet filters.
  const searchFilteredResources = useMemo(() => {
    if (!searchQuery.trim()) return initialResources;
    const lowerQuery = searchQuery.toLowerCase();
    return initialResources.filter(
      (resource) =>
        resource.title?.toLowerCase().includes(lowerQuery) ||
        resource.creators?.toLowerCase().includes(lowerQuery) ||
        resource.abstract?.toLowerCase().includes(lowerQuery) ||
        resource.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }, [initialResources, searchQuery]);

  // Apply all active filters + search to produce the displayed resource list.
  const filteredResources = useMemo(() => {
    let results = filterResources(initialResources, activeFilters);

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter(
        (resource) =>
          resource.title?.toLowerCase().includes(lowerQuery) ||
          resource.creators?.toLowerCase().includes(lowerQuery) ||
          resource.abstract?.toLowerCase().includes(lowerQuery) ||
          resource.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    }

    results.sort((a, b) => {
      const dateA = new Date(a.dateModified || 0);
      const dateB = new Date(b.dateModified || 0);
      return dateB - dateA;
    });

    return results;
  }, [initialResources, activeFilters, searchQuery]);

  // Format count display
  const resultCount = filteredResources.length;
  const resultText =
    resultCount > 99
      ? "+99 results"
      : `${resultCount} result${resultCount !== 1 ? "s" : ""}`;

  return (
    <div className="flex flex-col mx-auto px-4 md:px-8 gap-24">
      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar resources={initialResources} onSearch={setSearchQuery} value={searchQuery} />
      </div>
      <div className="flex flex-col lg:flex-row gap-16">
        {/* Left Sidebar - Filters */}
        <aside className="w-full lg:w-74 flex-shrink-0">
          <div className="lg:sticky lg:top-32 lg:max-h-[calc(100vh)]">
            {/* Filter Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h2
                  className="font-semibold text-text-primary mb-1"
                  style={{ fontSize: "var(--font-size-h4)" }}
                >
                  Resources filters
                </h2>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-md hover:bg-surface-secondary transition-colors disabled:opacity-50"
                  title="Refresh data from Zotero"
                  aria-label="Refresh data from Zotero"
                >
                  <svg
                    className={`w-4 h-4 text-text-secondary ${isRefreshing ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
              <p
                className="text-text-tertiary"
                style={{ fontSize: "var(--font-size-small)" }}
              >
                {resultText}
              </p>
            </div>

            {/* Filter Sidebar - Scrollable Container */}
            <div
              className="overflow-y-auto filter-sidebar-scroll"
              style={{
                maxHeight: "calc(100vh - 12rem)",
                overscrollBehavior: "contain",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-y",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <FilterSidebar
                resources={initialResources}
                countResources={searchFilteredResources}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearAll={handleClearAllFilters}
              />
            </div>
          </div>
        </aside>

        {/* Main Content - Resources Grid */}
        <main className="flex-1 min-w-0">
          {/* Resources Grid */}
          <div
            className="grid gap-8"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 400px), 1fr))",
            }}
          >
            {filteredResources.length > 0 ? (
              filteredResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p
                  className="text-text-secondary"
                  style={{ fontSize: "var(--font-size-body)" }}
                >
                  No resources found matching the selected filters.
                </p>
                <button
                  onClick={handleClearAllFilters}
                  className="mt-4 text-text-link underline hover:text-text-primary transition-colors"
                  style={{ fontSize: "var(--font-size-small)" }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
