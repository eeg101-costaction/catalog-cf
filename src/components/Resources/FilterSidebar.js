"use client";

import React, { useState } from "react";
import { formatTypeName, formatLanguageName } from "@/lib/filterUtils";

// Helper function to remove "Part X: " prefix from framework sections
const formatFrameworkSectionName = (section) => {
  if (!section) return section;
  return section.replace(/^Part \d+:\s*/i, "");
};

const ChevronIcon = ({ isOpen }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-200 ${
      isOpen ? "rotate-90" : ""
    }`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="border-b pb-4"
      style={{ borderColor: "var(--separator-subtle)" }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sticky w-full flex items-center justify-between py-2 text-left hover:bg-surface-primary py-2  transition-colors"
        style={{
          top: 0,
          backgroundColor: "var(--background-primary)",
          zIndex: 10,
        }}
      >
        <span
          className="font-medium text-text-primary"
          style={{ fontSize: "var(--font-size-body)" }}
        >
          {title}
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>
      {isOpen && <div className="mt-2 space-y-1">{children}</div>}
    </div>
  );
};

const FilterCheckbox = ({ id, label, count, checked, onChange }) => {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between cursor-pointer py-1.5 hover:bg-surface-primary rounded px-2 -mx-2 transition-colors group"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="appearance-none w-4 h-4 border-2 rounded cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: checked
                ? "var(--brand-primary)"
                : "var(--surface-primary)",
              borderColor: checked
                ? "var(--label-primary)"
                : "var(--separator-medium)",
            }}
          />
        </div>
        <span
          className="text-text-secondary group-hover:text-text-primary transition-colors"
          style={{ fontSize: "var(--font-size-small)" }}
        >
          {label}
        </span>
      </div>
      <span
        className="text-text-quaternary"
        style={{ fontSize: "var(--font-size-footnote)" }}
      >
        {count}
      </span>
    </label>
  );
};

const ActiveFilterChip = ({ label, onRemove }) => (
  <div
    className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
    style={{ background: "var(--surface-primary)" }}
  >
    <span
      className="text-text-primary"
      style={{ fontSize: "var(--font-size-small)" }}
    >
      {label}
    </span>
    <button
      onClick={onRemove}
      className="text-text-tertiary hover:text-text-primary transition-colors"
      aria-label={`Remove ${label} filter`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
);

export function FilterSidebar({ resources, countResources, activeFilters, onFilterChange, onClearAll }) {
  // The resource list used for counting. Falls back to all resources when not provided.
  const countBase = countResources || resources;

  // Available filter options (keys/labels) — always derived from the full resource list
  // so that options are never hidden just because they're filtered out.
  const filterOptions = React.useMemo(() => {
    const frameworkSections = new Set();
    const types = new Set();
    const languages = new Set();

    resources.forEach((resource) => {
      if (resource.manifestoPart) {
        const parts = Array.isArray(resource.manifestoPart)
          ? resource.manifestoPart
          : [resource.manifestoPart];
        parts.forEach((part) => frameworkSections.add(part));
      }
      if (resource.type) types.add(resource.type);
      const lang = resource.language || "Unknown";
      languages.add(lang);
    });

    return {
      frameworkSections: Array.from(frameworkSections).sort(),
      types: Array.from(types),
      languages: Array.from(languages).sort((a, b) => {
        if (a === "Unknown") return 1;
        if (b === "Unknown") return -1;
        return a.localeCompare(b);
      }),
    };
  }, [resources]);

  // Counts derived from countBase (search-filtered resources) so they update
  // when the user types in the search box.
  const filterCounts = React.useMemo(() => {
    const sectionCounts = {};
    const typeCounts = {};
    const languageCounts = {};

    countBase.forEach((resource) => {
      if (resource.manifestoPart) {
        const parts = Array.isArray(resource.manifestoPart)
          ? resource.manifestoPart
          : [resource.manifestoPart];
        parts.forEach((part) => {
          sectionCounts[part] = (sectionCounts[part] || 0) + 1;
        });
      }
      if (resource.type) {
        typeCounts[resource.type] = (typeCounts[resource.type] || 0) + 1;
      }
      const lang = resource.language || "Unknown";
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });

    return { sectionCounts, typeCounts, languageCounts };
  }, [countBase]);

  const toggleFilter = (category, value) => {
    const current = activeFilters[category] || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    onFilterChange({
      ...activeFilters,
      [category]: newValue,
    });
  };

  const removeFilter = (category, value) => {
    const current = activeFilters[category] || [];
    onFilterChange({
      ...activeFilters,
      [category]: current.filter((v) => v !== value),
    });
  };

  const clearAllFilters = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      onFilterChange({
        frameworkSections: [],
        types: [],
        languages: [],
        tags: [],
      });
    }
  };

  const hasActiveFilters =
    activeFilters.frameworkSections?.length > 0 ||
    activeFilters.types?.length > 0 ||
    activeFilters.languages?.length > 0 ||
    activeFilters.tags?.length > 0;

  return (
    <div className="w-full">
      {/* Active Filters */}
      {hasActiveFilters && (
        <div className=" mb-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            {activeFilters.frameworkSections?.map((section) => (
              <ActiveFilterChip
                key={`section-${section}`}
                label={formatFrameworkSectionName(section)}
                onRemove={() => removeFilter("frameworkSections", section)}
              />
            ))}
            {activeFilters.types?.map((type) => (
              <ActiveFilterChip
                key={`type-${type}`}
                label={formatTypeName(type)}
                onRemove={() => removeFilter("types", type)}
              />
            ))}
            {activeFilters.languages?.map((lang) => (
              <ActiveFilterChip
                key={`lang-${lang}`}
                label={formatLanguageName(lang)}
                onRemove={() => removeFilter("languages", lang)}
              />
            ))}
            {activeFilters.tags?.map((tag) => (
              <ActiveFilterChip
                key={`tag-${tag}`}
                label={tag}
                onRemove={() => removeFilter("tags", tag)}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={clearAllFilters}
              className="text-text-primary underline hover:text-text-secondary transition-colors"
              style={{ fontSize: "var(--font-size-small)" }}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Filter Sections */}
      <div className="space-y-2">
        {/* Framework Section */}
        <FilterSection title="Framework Section" defaultOpen={true}>
          {filterOptions.frameworkSections.length > 0 ? (
            filterOptions.frameworkSections.map((section) => (
              <FilterCheckbox
                key={section}
                id={`framework-${section}`}
                label={formatFrameworkSectionName(section)}
                count={filterCounts.sectionCounts[section] || 0}
                checked={
                  activeFilters.frameworkSections?.includes(section) || false
                }
                onChange={() => toggleFilter("frameworkSections", section)}
              />
            ))
          ) : (
            <p
              className="text-text-quaternary px-2 py-1"
              style={{ fontSize: "var(--font-size-footnote)" }}
            >
              No framework sections available
            </p>
          )}
        </FilterSection>

        {/* Type */}
        <FilterSection title="Type">
          {filterOptions.types.length > 0 ? (
            filterOptions.types
              .slice()
              .sort(
                (a, b) =>
                  (filterCounts.typeCounts[b] || 0) -
                  (filterCounts.typeCounts[a] || 0)
              )
              .map((type) => (
                <FilterCheckbox
                  key={type}
                  id={`type-${type}`}
                  label={formatTypeName(type)}
                  count={filterCounts.typeCounts[type] || 0}
                  checked={activeFilters.types?.includes(type) || false}
                  onChange={() => toggleFilter("types", type)}
                />
              ))
          ) : (
            <p
              className="text-text-quaternary px-2 py-1"
              style={{ fontSize: "var(--font-size-footnote)" }}
            >
              No types available
            </p>
          )}
        </FilterSection>

        {/* Language */}
        <FilterSection title="Language">
          {filterOptions.languages.length > 0 ? (
            filterOptions.languages.map((language) => (
              <FilterCheckbox
                key={language}
                id={`language-${language}`}
                label={formatLanguageName(language)}
                count={filterCounts.languageCounts[language] || 0}
                checked={activeFilters.languages?.includes(language) || false}
                onChange={() => toggleFilter("languages", language)}
              />
            ))
          ) : (
            <p
              className="text-text-quaternary px-2 py-1"
              style={{ fontSize: "var(--font-size-footnote)" }}
            >
              No languages available
            </p>
          )}
        </FilterSection>
      </div>
    </div>
  );
}
