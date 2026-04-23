"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Tags from "../ui/Tags";
import { OriginSourceButton, SignPledgeButton, ZoteroLinkButton } from "../ui/Button";
import { ZOTERO_GROUP_ID } from "@/lib/zotero/constants";

// Manifesto part URL mapping
const MANIFESTO_URLS = {
  "Part 1: Validity & Integrity":
    "https://cuttingeeg.github.io/EEG101CommunityFramework/#validity-and-scientific-integrity-in-times-of-rapidly-evolving-practices",
  "Part 2: Democratization":
    "https://cuttingeeg.github.io/EEG101CommunityFramework/#democratization-the-importance-of-diversity-and-inclusion-to-support-the-development-of-eeg-science",
  "Part 3: Responsibility":
    "https://cuttingeeg.github.io/EEG101CommunityFramework/#responsibility-considering-societal-impacts-issues-of-equity-and-sustainability",
};

// Extract section name from manifestoPart
const extractSectionName = (manifestoPart) => {
  if (!manifestoPart) return "";
  const colonIndex = manifestoPart.indexOf(":");
  return colonIndex !== -1
    ? manifestoPart.substring(colonIndex + 1).trim()
    : manifestoPart;
};

// Get pledge URL from manifesto part
const getPledgeUrl = (manifestoPart) => {
  // Normalize the manifesto part to match keys
  if (!manifestoPart) return null;

  // Try exact match first
  if (MANIFESTO_URLS[manifestoPart]) {
    return MANIFESTO_URLS[manifestoPart];
  }

  // Try matching by part number
  if (manifestoPart.includes("Part 1") || manifestoPart.includes("Validity")) {
    return MANIFESTO_URLS["Part 1: Validity & Integrity"];
  }
  if (
    manifestoPart.includes("Part 2") ||
    manifestoPart.includes("Democratization")
  ) {
    return MANIFESTO_URLS["Part 2: Democratization"];
  }
  if (
    manifestoPart.includes("Part 3") ||
    manifestoPart.includes("Responsibility")
  ) {
    return MANIFESTO_URLS["Part 3: Responsibility"];
  }

  return null;
};

export default function ResourceDetail({ resource }) {
  const router = useRouter();

  // Scroll to section handler
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Go back handler
  const handleGoBack = () => {
    router.back();
  };

  // Format creator with year
  const authorWithYear = resource.creators || resource.websiteName || "Unknown";
  const displayYear = resource.year ? `(${resource.year})` : "";

  // Get the origin URL (DOI or URL)
  const originUrl = resource.doi
    ? `https://doi.org/${resource.doi}`
    : resource.url;

  // Build Zotero library URL if we have the item ID
  const zoteroUrl = resource.id
    ? resource.collectionKey
      ? `https://www.zotero.org/groups/${ZOTERO_GROUP_ID}/eegcommunityframework/collections/${resource.collectionKey}/items/${resource.id}/collection`
      : `https://www.zotero.org/groups/${ZOTERO_GROUP_ID}/eegcommunityframework/items/${resource.id}/library`
    : null;

  // Prepare manifesto parts for buttons
  const manifestoParts = Array.isArray(resource.manifestoPart)
    ? resource.manifestoPart
    : resource.manifestoPart
    ? [resource.manifestoPart]
    : [];

  return (
    <div
      className="resource-detail-grid grid gap-12"
      style={{
        gridTemplateColumns: "1fr 250px",
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        padding: "var(--container-padding)",
        minHeight: "100vh",
      }}
    >
      {/* Main Content Section */}
      <main>
        {/* Go Back Button */}
        <button
          onClick={handleGoBack}
          className="w-9 h-9 rounded-full flex items-center justify-center mb-6 border-0 cursor-pointer transition-all duration-[var(--transition-fast)]"
          style={{
            background: "var(--surface-secondary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface-tertiary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--surface-secondary)";
          }}
          aria-label="Go back"
        >
          <Image
            src="/assets/icons/Go-back.svg"
            alt="Go back"
            width={36}
            height={36}
            className="w-9 h-9"
            priority
          />
        </button>

        {/* Header Section */}
        <header className="mb-16">
          {/* Author & Date */}
          <div
            className="mb-6"
            style={{
              fontSize: "var(--font-size-body)",
              color: "var(--text-primary)",
              fontWeight: 400,
            }}
          >
            {authorWithYear} {displayYear}
          </div>

          {/* Title */}
          <h1
            className="mb-4"
            style={{
              fontSize: "var(--font-size-h2)",
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.3,
            }}
          >
            {resource.title}
          </h1>

          {/* DOI if present */}
          {resource.doi && (
            <div
              className="mb-4 break-all"
              style={{
                fontSize: "var(--font-size-small)",
                color: "var(--text-link)",
              }}
            >
              <a
                href={`https://doi.org/${resource.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "underline" }}
              >
                https://doi.org/{resource.doi}
              </a>
            </div>
          )}

          {/* URL if present and different from DOI */}
          {resource.url && resource.url !== resource.doi && (
            <div
              className="mb-4 break-all"
              style={{
                fontSize: "var(--font-size-small)",
                color: "var(--text-link)",
              }}
            >
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "underline" }}
              >
                {resource.url}
              </a>
            </div>
          )}

          {/* Tags Container */}
          <div className="flex gap-3 flex-wrap items-center mb-6">
            {/* Resource Type Tag */}
            <Tags
              labels={[
                {
                  icon: `/assets/icons/${resource.family}.svg`,
                  label:
                    resource.type.charAt(0).toUpperCase() +
                    resource.type.slice(1).replace(/([A-Z])/g, " $1"),
                },
              ]}
              variant="resource-type"
              themeColor={resource.themeColor || "grey"}
              textSize="caption"
              withIcon
            />

            {/* Manifesto Part Tags */}
            {manifestoParts.map((part, idx) => (
              <Tags
                key={idx}
                labels={[extractSectionName(part)]}
                variant="framework"
                textSize="caption"
              />
            ))}

            {/* Content Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="flex gap-3 flex-wrap items-center">
                {resource.tags.slice(0, 10).map((tag, idx) => (
                  <Link
                    key={idx}
                    href={`/resources?tag=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-full whitespace-nowrap hover:opacity-80 transition-opacity"
                    style={{
                      background: "var(--surface-secondary)",
                      border: "var(--separator-light)",
                      color: "var(--text-quaternary)",
                      fontSize: "var(--font-size-caption)",
                      fontWeight: 550,
                    }}
                    title={tag}
                  >
                    {tag}
                  </Link>
                ))}
                {resource.tags.length > 10 && (
                  <span
                    className="px-2 rounded-full"
                    style={{
                      background: "var(--surface-secondary)",
                      border: "var(--separator-light)",
                      color: "var(--text-quaternary)",
                      fontSize: "var(--font-size-caption)",
                      fontWeight: 550,
                    }}
                  >
                    …
                  </span>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Abstract Content */}
        <section id="abstract" className="mb-12">
          <p
            style={{
              fontSize: "var(--font-size-body)",
              color: "var(--text-primary)",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {resource.abstract ||
              resource.description ||
              "No abstract available."}
          </p>
        </section>

        {/* Action Buttons */}
        <section id="actions" className="flex flex-col gap-6 flex-wrap">
          {/* Modified date */}
          {resource.dateModified && (
            <p
              style={{
                fontSize: "var(--font-size-caption)",
                color: "var(--text-tertiary)",
              }}
            >
              Last modified in Zotero: {new Date(resource.dateModified).toLocaleDateString()}
            </p>
          )}

          {/* Origin Source Button */}
          {originUrl && (
            <div id="origin-sources">
              <OriginSourceButton
                onClick={() => window.open(originUrl, "_blank")}
              >
                Origin Sources
              </OriginSourceButton>
            </div>
          )}

          {/* Zotero Link Button */}
          {zoteroUrl && (
            <div id="zotero-link">
              <ZoteroLinkButton
                onClick={() => window.open(zoteroUrl, "_blank")}
              >
                View in Zotero
              </ZoteroLinkButton>
            </div>
          )}

          {/* Sign Pledge Buttons */}
          {manifestoParts.map((part, idx) => {
            const pledgeUrl = getPledgeUrl(part);
            if (!pledgeUrl) return null;

            const sectionName = extractSectionName(part);

            return (
              <div key={idx} id={idx === 0 ? "sign-pledge" : undefined}>
                <SignPledgeButton
                  onClick={() => window.open(pledgeUrl, "_blank")}
                >
                  Sign {sectionName} Part
                </SignPledgeButton>
              </div>
            );
          })}
        </section>
      </main>

      {/* Table of Contents Sidebar */}
      <aside
        className="toc-sidebar sticky p-6"
        style={{
          top: "8rem",
          height: "fit-content",
        }}
      >
        {/* Title */}
        <h3
          className="mb-8 uppercase tracking-wide"
          style={{
            fontSize: "var(--font-size-footnote)",
            fontWeight: 700,
            color: "var(--text-tertiary)",
          }}
        >
          Summary
        </h3>

        {/* Navigation Links */}
        <nav>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {/* Abstract Link */}
            <li>
              <button
                onClick={() => scrollToSection("abstract")}
                className="w-full text-left py-2 bg-transparent border-0 cursor-pointer font-normal transition-colors duration-[var(--transition-fast)]"
                style={{
                  fontSize: "var(--font-size-small)",
                  color: "var(--text-primary)",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.color = "var(--text-link)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.color = "var(--text-primary)")
                }
              >
                Abstract
              </button>
            </li>

            {/* Origin Sources Link */}
            {originUrl && (
              <li>
                <button
                  onClick={() => scrollToSection("origin-sources")}
                  className="w-full text-left py-2 bg-transparent border-0 cursor-pointer font-normal transition-colors duration-[var(--transition-fast)]"
                  style={{
                    fontSize: "var(--font-size-small)",
                    color: "var(--text-primary)",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.color = "var(--text-link)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.color = "var(--text-primary)")
                  }
                >
                  Origin Sources
                </button>
              </li>
            )}

            {/* Zotero Link */}
            {zoteroUrl && (
              <li>
                <button
                  onClick={() => scrollToSection("zotero-link")}
                  className="w-full text-left py-2 bg-transparent border-0 cursor-pointer font-normal transition-colors duration-[var(--transition-fast)]"
                  style={{
                    fontSize: "var(--font-size-small)",
                    color: "var(--text-primary)",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.color = "var(--text-link)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.color = "var(--text-primary)")
                  }
                >
                  View in Zotero
                </button>
              </li>
            )}

            {/* Sign the Pledge Link */}
            {manifestoParts.length > 0 && (
              <li>
                <button
                  onClick={() => scrollToSection("sign-pledge")}
                  className="w-full text-left py-2 bg-transparent border-0 cursor-pointer font-normal transition-colors duration-[var(--transition-fast)]"
                  style={{
                    fontSize: "var(--font-size-small)",
                    color: "var(--text-primary)",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.color = "var(--text-link)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.color = "var(--text-primary)")
                  }
                >
                  Sign the Pledge
                </button>
              </li>
            )}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
