import Link from "next/link";

export default function InformationCard({ content, href }) {
  const cardContent = (
    <div
      className="rounded-2xl p-8 hover:shadow-lg transition-shadow flex items-center justify-center h-full min-h-[180px]"
      style={{ background: "var(--brand-secondary)" }}
    >
      <p
        className="font-semibold leading-relaxed text-center"
        style={{
          fontSize: "var(--font-size-body)",
          color: "var(--text-primary)",
        }}
      >
        {content}
      </p>
    </div>
  );

  if (!href) {
    return cardContent;
  }

  return (
    <Link
      href={href}
      className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        borderRadius: "1rem",
        color: "inherit",
        textDecoration: "none",
      }}
      aria-label={`Browse resources for: ${content}`}
    >
      {cardContent}
    </Link>
  );
}
