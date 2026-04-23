/**
 * Utility functions for the filter system
 */

/**
 * Format item type names for display
 * Converts camelCase to Title Case with spaces
 */
export function formatTypeName(type) {
  if (!type) return "Unknown";

  // Convert camelCase to Title Case
  const formatted = type
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

  return formatted;
}

/**
 * Format language name for display
 */
export function formatLanguageName(language) {
  if (!language || language === "Unknown") {
    return "Not specified";
  }
  return language;
}

/**
 * Get a formatted display label for a filter value
 */
export function getFilterDisplayLabel(category, value) {
  switch (category) {
    case "types":
      return formatTypeName(value);
    case "languages":
      return formatLanguageName(value);
    default:
      return value;
  }
}

/**
 * Check if a resource matches all active filters
 */
export function matchesFilters(resource, activeFilters) {
  // Framework Section filter
  if (activeFilters.frameworkSections?.length > 0) {
    const parts = Array.isArray(resource.manifestoPart)
      ? resource.manifestoPart
      : [resource.manifestoPart];

    const hasMatchingSection = activeFilters.frameworkSections.some((section) =>
      parts.includes(section),
    );

    if (!hasMatchingSection) return false;
  }

  // Type filter
  if (activeFilters.types?.length > 0) {
    if (!activeFilters.types.includes(resource.type)) {
      return false;
    }
  }

  // Language filter
  if (activeFilters.languages?.length > 0) {
    const resourceLanguage = resource.language || "Unknown";
    if (!activeFilters.languages.includes(resourceLanguage)) {
      return false;
    }
  }

  // Tag filter
  if (activeFilters.tags?.length > 0) {
    const resourceTags = resource.tags || [];
    const hasMatchingTag = activeFilters.tags.some((filterTag) =>
      resourceTags.some(
        (resourceTag) =>
          resourceTag.toLowerCase() === filterTag.toLowerCase(),
      ),
    );

    if (!hasMatchingTag) return false;
  }

  return true;
}
