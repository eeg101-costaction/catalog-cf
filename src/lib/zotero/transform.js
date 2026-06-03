/**
 * Zotero Data Transformation Layer
 *
 * This file converts raw Zotero API data into simplified, clean objects
 * that are easier to work with in the frontend.
 *
 * Raw Zotero item structure:
 * {
 *   key: 'ABC123',
 *   version: 123,
 *   data: {
 *     itemType: 'book',
 *     title: 'Book Title',
 *     creators: [{ creatorType: 'author', firstName: 'John', lastName: 'Doe' }],
 *     date: '2024',
 *     ...many other fields
 *   }
 * }
 *
 * Transformed resource structure:
 * {
 *   id: 'ABC123',
 *   type: 'book',
 *   family: 'bibliographic',
 *   color: 'blue-700',
 *   title: 'Book Title',
 *   authors: 'John Doe',
 *   year: '2024',
 *   ...only relevant fields for this family
 * }
 */

import {
  getFamilyForItemType,
  getColorForItemType,
  getColorForFamily,
  FAMILY_DISPLAY_FIELDS,
} from "./constants.js";

/**
 * Normalize language codes to standard language names
 *
 * @param {string} languageCode - Raw language code from Zotero
 * @returns {string} Normalized language name ("English", "French", or "Unknown")
 *
 * Handles variations like:
 * - en, en-US, en-GB, eng, English → "English"
 * - fr, fr-FR, French → "French"
 * - null, undefined, empty → "Unknown"
 */
function normalizeLanguage(languageCode) {
  if (!languageCode) return "Unknown";

  // Convert to lowercase for comparison
  const code = languageCode.toLowerCase().trim();

  // English variations
  if (
    code === "en" ||
    code === "eng" ||
    code === "english" ||
    code.startsWith("en-") ||
    code.startsWith("en_")
  ) {
    return "English";
  }

  // French variations
  if (
    code === "fr" ||
    code === "french" ||
    code.startsWith("fr-") ||
    code.startsWith("fr_")
  ) {
    return "French";
  }

  // Any other language defaults to Unknown
  return "Unknown";
}

/**
 * Format creators (authors, directors, etc.) into a readable string
 *
 * @param {Array} creators - Array of creator objects from Zotero
 * @returns {string} Formatted string like "John Doe, Jane Smith"
 *
 * Example:
 * [
 *   { creatorType: 'author', firstName: 'John', lastName: 'Doe' },
 *   { creatorType: 'author', firstName: 'Jane', lastName: 'Smith' }
 * ]
 * → "John Doe, Jane Smith"
 */
function formatCreators(creators) {
  if (!creators || !Array.isArray(creators) || creators.length === 0) {
    return "";
  }

  return creators
    .map((creator) => {
      if (creator.name) {
        // Institutional or single-field name
        return creator.name;
      }
      // Person with firstName and lastName
      const parts = [];
      if (creator.firstName) parts.push(creator.firstName);
      if (creator.lastName) parts.push(creator.lastName);
      return parts.join(" ");
    })
    .filter(Boolean) // Remove empty strings
    .join(", ");
}

/**
 * Extract the year from a date string
 *
 * @param {string} dateString - Date string from Zotero (e.g., "2024-03-15", "2024", "March 2024")
 * @returns {string} Just the year (e.g., "2024")
 */
function extractYear(dateString) {
  if (!dateString) return "";

  // Try to extract 4-digit year
  const yearMatch = dateString.match(/\d{4}/);
  return yearMatch ? yearMatch[0] : dateString;
}

/**
 * Truncate text to a specified length, adding ellipsis
 *
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 150)
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 150) {
  if (!text) return "";
  if (text.length <= maxLength) return text;

  // Truncate at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + "..."
    : truncated + "...";
}

/**
 * Format tags from Zotero into a simple array of strings
 *
 * @param {Array} tags - Array of tag objects from Zotero
 * @returns {Array<string>} Array of tag names
 *
 * Example: [{ tag: 'EEG' }, { tag: 'Research' }] → ['EEG', 'Research']
 */
function formatTags(tags) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return [];
  }

  return tags.map((t) => t.tag || t).filter(Boolean);
}

/**
 * Check if resource has a specific tag (case-insensitive)
 *
 * @param {Array} tags - Array of tag objects or strings from Zotero
 * @param {string} tagName - Tag name to check for
 * @returns {boolean} True if tag exists
 */
function hasTag(tags, tagName) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return false;
  }

  const lowerTagName = tagName.toLowerCase();
  return tags.some((t) => {
    const tag = typeof t === "string" ? t : t.tag;
    return tag && tag.toLowerCase() === lowerTagName;
  });
}

/**
 * Generate APA citation for bibliographic resources
 *
 * @param {Object} data - Raw Zotero item data
 * @param {string} itemType - The Zotero item type
 * @returns {string} APA formatted citation
 */
function generateAPACitation(data, itemType) {
  const parts = [];

  // Authors (Last, F. M.)
  if (data.creators && data.creators.length > 0) {
    const authorNames = data.creators
      .filter((c) => c.creatorType === "author" || c.creatorType === "director")
      .map((creator) => {
        if (creator.name) return creator.name;
        const lastName = creator.lastName || "";
        const firstInitial = creator.firstName
          ? creator.firstName.charAt(0) + "."
          : "";
        return `${lastName}${firstInitial ? ", " + firstInitial : ""}`;
      })
      .join(", ");

    if (authorNames) parts.push(authorNames);
  }

  // Year
  if (data.date) {
    const year = extractYear(data.date);
    if (year) parts.push(`(${year})`);
  }

  // Title
  if (data.title) {
    parts.push(`${data.title}.`);
  }

  // Publication details based on type
  if (itemType === "journalArticle") {
    const journalParts = [];
    if (data.publicationTitle) journalParts.push(`*${data.publicationTitle}*`);
    if (data.volume) journalParts.push(data.volume);
    if (data.issue) journalParts.push(`(${data.issue})`);
    if (data.pages) journalParts.push(data.pages);
    if (journalParts.length > 0) parts.push(journalParts.join(", ") + ".");
  } else if (itemType === "book") {
    if (data.publisher) parts.push(`${data.publisher}.`);
  } else if (itemType === "bookSection") {
    if (data.bookTitle) parts.push(`In *${data.bookTitle}*`);
    if (data.publisher)
      parts.push(`(pp. ${data.pages || ""}). ${data.publisher}.`);
  }

  // DOI or URL
  if (data.DOI) {
    parts.push(`https://doi.org/${data.DOI}`);
  } else if (data.url) {
    parts.push(data.url);
  }

  return parts.join(" ");
}

/**
 * Transform a raw Zotero item into a simplified resource object
 *
 * @param {Object} rawItem - Raw item object from Zotero API
 * @param {Object} options - Optional parameters
 * @param {string} options.collectionName - Name of the collection this item belongs to (e.g., "Part 1: Validity")
 * @param {string} options.collectionKey - Key of the collection
 * @returns {Object} Simplified resource object
 *
 * Example usage:
 * const rawItem = { key: 'ABC123', data: { itemType: 'book', title: 'My Book', ... } };
 * const resource = transformItem(rawItem, { collectionName: 'Part 1: Validity' });
 */
export function transformItem(rawItem, options = {}) {
  // Extract basic info
  const data = rawItem.data || rawItem;
  const itemType = data.itemType;
  const family = getFamilyForItemType(itemType);
  const color = getColorForItemType(itemType);
  const themeColor = getColorForFamily(family);

  // Base resource object
  const resource = {
    id: rawItem.key,
    type: itemType,
    family,
    color,
    themeColor,
  };

  // Add collection info (manifesto part)
  if (options.collectionName) {
    // Handle both single string and array of collection names
    resource.manifestoPart = Array.isArray(options.collectionName)
      ? options.collectionName
      : options.collectionName;
  }
  if (options.collectionKey) {
    resource.collectionKey = options.collectionKey;
  }

  // Add title (all items have a title)
  resource.title = data.title || "(Untitled)";

  // Add creators (formatted as string)
  if (data.creators && data.creators.length > 0) {
    resource.creators = formatCreators(data.creators);
    // Keep raw creators for detail view (APA citation)
    resource.creatorsRaw = data.creators;
  }

  // Add date/year
  if (data.date) {
    resource.year = extractYear(data.date);
    resource.date = data.date;
  }

  // Add tags
  if (data.tags && data.tags.length > 0) {
    resource.tags = formatTags(data.tags);

    // Check for special tags
    resource.isWorkshop = hasTag(data.tags, "workshop");
  }

  // Add URL if available
  if (data.url) {
    resource.url = data.url;
  }

  // Add dateModified (when the item was last modified in Zotero)
  if (data.dateModified) {
    resource.dateModified = data.dateModified;
  }

  // Add DOI if available
  if (data.DOI) {
    resource.doi = data.DOI;
  }

  // Extract related item keys from Zotero relations field
  // The dc:relation field contains URLs like "http://zotero.org/groups/.../items/ITEMKEY"
  const dcRelation = data.relations?.["dc:relation"];
  if (dcRelation) {
    const relationUrls = Array.isArray(dcRelation) ? dcRelation : [dcRelation];
    const relatedIds = relationUrls
      .map((url) => {
        const match = url.match(/\/items\/([A-Z0-9]+)$/);
        return match ? match[1] : null;
      })
      .filter(Boolean);
    if (relatedIds.length > 0) {
      resource.relatedIds = relatedIds;
    }
  }

  // Add abstract (full and truncated for card preview)
  if (data.abstractNote) {
    resource.abstract = data.abstractNote;
    resource.abstractPreview = truncateText(data.abstractNote, 150);
  }

  // Add language field (works for all item types)
  // Normalize to "English", "French", or "Unknown"
  // For technical items, prefer programmingLanguage over general language field
  if (family === "technical" && data.programmingLanguage) {
    resource.language = normalizeLanguage(data.programmingLanguage);
  } else if (data.language) {
    resource.language = normalizeLanguage(data.language);
  }

  // Add family-specific fields based on item type
  switch (family) {
    case "bibliographic":
      // Books, articles, etc.
      if (data.publicationTitle) resource.publication = data.publicationTitle;
      if (data.publisher) resource.publisher = data.publisher;
      if (data.pages) resource.pages = data.pages;
      if (data.volume) resource.volume = data.volume;
      if (data.issue) resource.issue = data.issue;
      if (data.bookTitle) resource.bookTitle = data.bookTitle;

      // Generate APA citation for detail view
      resource.citation = generateAPACitation(data, itemType);
      break;

    case "multimedia":
      // Videos, podcasts, audio
      if (data.runningTime) resource.duration = data.runningTime;
      if (data.studio) resource.studio = data.studio;
      if (data.videoRecordingFormat)
        resource.format = data.videoRecordingFormat;
      if (data.abstractNote) resource.description = data.abstractNote;
      break;

    case "technical":
      // Software, datasets, code
      if (data.versionNumber) resource.version = data.versionNumber;
      if (data.company) resource.company = data.company;
      // Language already set above
      if (data.repository) resource.repository = data.repository;
      if (data.abstractNote) resource.description = data.abstractNote;
      break;

    case "webpage":
      // Web pages, blog posts
      if (data.websiteTitle) resource.websiteTitle = data.websiteTitle;
      if (data.websiteName) resource.websiteName = data.websiteName;
      if (data.accessDate) resource.accessDate = data.accessDate;
      if (data.abstractNote) resource.description = data.abstractNote;
      break;
  }

  return resource;
}

/**
 * Transform an array of raw Zotero items
 *
 * @param {Array} rawItems - Array of raw Zotero items
 * @param {Object} options - Optional parameters (passed to transformItem)
 * @returns {Array} Array of transformed resource objects
 */
export function transformItems(rawItems, options = {}) {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems.map((item) => transformItem(item, options));
}

/**
 * Group resources by their family
 *
 * @param {Array} resources - Array of transformed resources
 * @returns {Object} Object with families as keys and arrays of resources as values
 *
 * Example return:
 * {
 *   bibliographic: [...],
 *   multimedia: [...],
 *   technical: [...],
 *   webpage: [...]
 * }
 */
export function groupByFamily(resources) {
  const grouped = {
    bibliographic: [],
    multimedia: [],
    technical: [],
    webpage: [],
  };

  resources.forEach((resource) => {
    const family = resource.family;
    if (grouped[family]) {
      grouped[family].push(resource);
    }
  });

  return grouped;
}

/**
 * Get statistics about resources
 *
 * @param {Array} resources - Array of transformed resources
 * @returns {Object} Statistics object
 *
 * Example return:
 * {
 *   total: 150,
 *   byFamily: {
 *     bibliographic: 100,
 *     multimedia: 20,
 *     technical: 15,
 *     webpage: 15
 *   },
 *   byType: {
 *     book: 30,
 *     journalArticle: 50,
 *     videoRecording: 20,
 *     ...
 *   }
 * }
 */
export function getResourceStats(resources) {
  const stats = {
    total: resources.length,
    byFamily: {
      bibliographic: 0,
      multimedia: 0,
      technical: 0,
      webpage: 0,
    },
    byType: {},
  };

  resources.forEach((resource) => {
    // Count by family
    if (stats.byFamily[resource.family] !== undefined) {
      stats.byFamily[resource.family]++;
    }

    // Count by type
    if (!stats.byType[resource.type]) {
      stats.byType[resource.type] = 0;
    }
    stats.byType[resource.type]++;
  });

  return stats;
}

/**
 * Prepare resource data for card view (list display)
 *
 * Returns only the fields needed for the card:
 * - creators (author/director/site name)
 * - manifestoPart (Part 1, 2, or 3)
 * - type
 * - title
 * - year
 * - abstractPreview (truncated)
 * - tags
 * - color info
 *
 * @param {Object} resource - Transformed resource object
 * @returns {Object} Card-ready object with only necessary fields
 */
export function prepareForCard(resource) {
  return {
    id: resource.id,
    type: resource.type,
    family: resource.family,
    color: resource.color,
    themeColor: resource.themeColor,
    title: resource.title,
    creators: resource.creators || "",
    manifestoPart: resource.manifestoPart || "",
    year: resource.year || "",
    abstractPreview: resource.abstractPreview || "",
    tags: resource.tags || [],
  };
}

/**
 * Prepare resource data for detail view (full page)
 *
 * Returns all fields needed for the detail page:
 * - All card fields
 * - Full abstract
 * - APA citation (for bibliographic)
 * - DOI
 * - URL
 * - All family-specific fields
 *
 * @param {Object} resource - Transformed resource object
 * @returns {Object} Detail-ready object with all fields
 */
export function prepareForDetail(resource) {
  const detail = {
    ...resource,
    // Remove internal fields that aren't needed in frontend
    creatorsRaw: undefined,
  };

  return detail;
}
