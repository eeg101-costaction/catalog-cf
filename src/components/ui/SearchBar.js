"use client";

import { useState, useCallback } from "react";

/**
 * SearchBar Component
 * Barre de recherche stylisée avec fond vert
 * Filtre les ressources par titre, auteurs, tags et abstract
 */
export default function SearchBar({ resources = [], onSearch, onCommit, value }) {
  // If a controlled value is provided, use it; otherwise fall back to internal state.
  const isControlled = value !== undefined;
  const [internalQuery, setInternalQuery] = useState("");
  const searchQuery = isControlled ? value : internalQuery;

  // Handle search input change
  const handleChange = (e) => {
    const query = e.target.value;
    if (!isControlled) setInternalQuery(query);
    if (onSearch) onSearch(query);
  };

  // Commit on Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onCommit) {
      onCommit(searchQuery);
    }
  };

  // Handle clear button
  const handleClear = () => {
    if (!isControlled) setInternalQuery("");
    if (onSearch) onSearch("");
    if (onCommit) onCommit("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          type="text"
          placeholder="Search a resource..."
          value={searchQuery}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full pl-12 pr-10 py-3 text-gray-800 placeholder-gray-600 rounded-full outline-none transition-colors bg-[#BDD4F2] focus:bg-[#A8C5E8] focus:ring-2"
          aria-label="Search resources"
        />

        {/* Clear button - visible when there's text */}
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 focus:outline-none"
            aria-label="Clear search"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
