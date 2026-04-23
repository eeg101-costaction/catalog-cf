"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/ui/SearchBar";
import { FilterSidebar } from "./FilterSidebar";
import { ResourceCard } from "./ResourceCard";
import { matchesFilters } from "@/lib/filterUtils";

/**
 * Filter resources based on active filters
 */
function filterResources(resources, activeFilters) {
  return resources.filter((resource) =>
    matchesFilters(resource, activeFilters),
  );
}

export function ResourcesPageClient({ initialResources }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasInitializedFiltersFromUrl = useRef(false);
  const hasInitializedSearchFromUrl = useRef(false);
  const [activeFilters, setActiveFilters] = useState({
    frameworkSections: [],
    types: [],
    languages: [],
    tags: [],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize search query from URL parameters
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl) {
      setSearchQuery(decodeURIComponent(searchFromUrl));
    } else if (hasInitializedSearchFromUrl.current) {
      // Only clear search if we've been initialized and search param is removed
      setSearchQuery("");
    }

    // Get tag filters from URL
    const tagsFromUrl = searchParams.getAll("tag");
    if (tagsFromUrl.length > 0) {
      const decodedTags = tagsFromUrl.map((tag) => decodeURIComponent(tag));
      setActiveFilters((prev) => ({
        ...prev,
        tags: decodedTags,
      }));
    } else if (hasInitializedSearchFromUrl.current) {
      // Clear tags if no tag params
      setActiveFilters((prev) => ({
        ...prev,
        tags: [],
      }));
    }

    hasInitializedSearchFromUrl.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (hasInitializedFiltersFromUrl.current) {
      return;
    }

    const sectionFromAlias = searchParams.get("section");
    const sectionFromQuery = searchParams.getAll("frameworkSection");

    const allSections = Array.from(
      new Set(
        initialResources.flatMap((resource) =>
          Array.isArray(resource.manifestoPart)
            ? resource.manifestoPart
            : resource.manifestoPart
              ? [resource.manifestoPart]
              : []
        )
      )
    );

    let sectionsFromUrl = [];

    if (sectionFromQuery.length > 0) {
      sectionsFromUrl = sectionFromQuery.filter((section) =>
        allSections.includes(section)
      );
    } else {
      const aliasToPattern = {
        part1: /^Part\s*1\b/i,
        part2: /^Part\s*2\b/i,
        part3: /^Part\s*3\b/i,
      };

      const pattern = aliasToPattern[(sectionFromAlias || "").toLowerCase()];
      if (pattern) {
        sectionsFromUrl = allSections.filter((section) => pattern.test(section));
      }
    }

    if (sectionsFromUrl.length > 0) {
      setActiveFilters((previous) => ({
        ...previous,
        frameworkSections: sectionsFromUrl,
      }));
    }

    hasInitializedFiltersFromUrl.current = true;
  }, [searchParams, initialResources]);

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

  // Apply filters to resources
  const filteredResources = useMemo(() => {
    // First apply category filters
    let results = filterResources(initialResources, activeFilters);

    // Then apply search query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter((resource) => {
        const titleMatch = resource.title?.toLowerCase().includes(lowerQuery);
        const creatorsMatch = resource.creators
          ?.toLowerCase()
          .includes(lowerQuery);
        const abstractMatch = resource.abstract
          ?.toLowerCase()
          .includes(lowerQuery);
        const tagsMatch = resource.tags?.some((tag) =>
          tag.toLowerCase().includes(lowerQuery),
        );

        return titleMatch || creatorsMatch || abstractMatch || tagsMatch;
      });
    }

    // Sort by modification date (most recent first)
    results.sort((a, b) => {
      const dateA = new Date(a.dateModified || 0);
      const dateB = new Date(b.dateModified || 0);
      return dateB - dateA; // Descending order (most recent first)
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
        <SearchBar resources={initialResources} onSearch={setSearchQuery} />
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
                activeFilters={activeFilters}
                onFilterChange={setActiveFilters}
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
                  onClick={() =>
                    setActiveFilters({
                      frameworkSections: [],
                      types: [],
                      languages: [],
                    })
                  }
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
