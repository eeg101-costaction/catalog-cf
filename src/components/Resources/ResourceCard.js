import React from "react";
import Tags from "../ui/Tags";
import Link from "next/link";
import Image from "next/image";

export const ResourceCard = React.memo(function ResourceCard({ resource }) {
  const author =
    resource.creators ||
    resource.websiteName ||
    resource.websiteTitle ||
    "Unknown";
  const manifesto = resource.manifestoPart || "";
  const type = resource.type || "";

  // Extract section name from manifestoPart (e.g., "Part 1: Validity & Integrity" -> "Validity & Integrity")
  const extractSectionName = (manifestoPart) => {
    if (!manifestoPart) return "";
    const colonIndex = manifestoPart.indexOf(":");
    return colonIndex !== -1
      ? manifestoPart.substring(colonIndex + 1).trim()
      : manifestoPart;
  };

  // Check if resource has Workshop tag and reorder tags accordingly
  const hasWorkshopTag = resource.tags?.some(
    (tag) => tag.toLowerCase() === "workshop"
  );

  const orderedTags = resource.tags
    ? [...resource.tags].sort((a, b) => {
        const aIsWorkshop = a.toLowerCase() === "workshop";
        const bIsWorkshop = b.toLowerCase() === "workshop";
        if (aIsWorkshop && !bIsWorkshop) return -1;
        if (!aIsWorkshop && bIsWorkshop) return 1;
        return 0;
      })
    : [];

  return (
    <Link
      href={`/resources/${resource.id}`}
      className="flex flex-col min-h-[220px] overflow-hidden rounded-xl border shadow-sm cursor-pointer no-underline"
      style={{
        background: "var(--surface-primary)",
        borderColor: "var(--separator-subtle)",
        transition: "box-shadow var(--transition-fast)",
      }}
    >
      {/* Header */}
      <div
        className="flex justify-between items-start p-6 pb-6"
        style={{
          fontSize: "var(--font-size-footnote)",
          color: "var(--text-primary)",
        }}
      >
        <div className="truncate" style={{ fontWeight: 400 }}>
          {author}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {Array.isArray(resource.manifestoPart)
            ? resource.manifestoPart.map((part, idx) => (
                <Tags
                  key={idx}
                  labels={[extractSectionName(part)]}
                  variant="framework"
                  textSize="caption"
                />
              ))
            : resource.manifestoPart && (
                <Tags
                  labels={[extractSectionName(resource.manifestoPart)]}
                  variant="framework"
                  textSize="caption"
                />
              )}
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
        </div>
      </div>

      {/* Separator line */}
      <div
        className="mx-6"
        style={{
          borderTop: "2px solid var(--separator-medium)",
        }}
      />

      <div className="flex-1 px-6 py-6">
        <div
          className="mb-1"
          style={{
            fontSize: "var(--font-size-h4)",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {resource.title}
        </div>
        {resource.year && (
          <div
            className="mb-1"
            style={{
              fontSize: "var(--font-size-footnote)",
              color: "var(--text-primary)",
            }}
          >
            {resource.year}
          </div>
        )}
        <div
          className="line-clamp-2 min-h-[2.2em]"
          style={{
            color: "var(--text-secondary)",
            fontSize: "var(--font-size-caption)",
          }}
        >
          {resource.abstractPreview || "No description available"}
        </div>
      </div>
      <div className="flex items-center justify-between px-6 pt-2 pb-6 gap-4">
        <div className="flex items-center gap-2 truncate">
          {hasWorkshopTag && (
            <Image
              src="/assets/icons/Workshop.svg"
              alt="Workshop"
              width={20}
              height={20}
              className="flex-shrink-0"
            />
          )}
          {orderedTags.length > 0 ? (
            <div className="flex flex-nowrap gap-2 min-w-0 truncate">
              {orderedTags.slice(0, 5).map((tag, idx) => (
                <Link
                  key={idx}
                  href={`/resources?tag=${encodeURIComponent(tag)}`}
                  onClick={(e) => e.stopPropagation()}
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
              {orderedTags.length > 5 && (
                <span
                  className="px-2 rounded-full"
                  style={{
                    background: "var(--surface-secondary)",
                    border: "var(--separator-light)",
                    color: "var(--text-quaternary)",
                    fontSize: "var(--font-size-small)",
                    fontWeight: 600,
                  }}
                >
                  …
                </span>
              )}
            </div>
          ) : (
            <div />
          )}
        </div>
        <span
          className="ml-4 underline decoration-1 underline-offset-2 whitespace-nowrap flex-shrink-0 cursor-pointer"
          style={{
            fontSize: "var(--font-size-caption)",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          Read more
        </span>
      </div>
    </Link>
  );
});
