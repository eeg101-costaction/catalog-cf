import Image from "next/image";

export function SignPledgeButton({
  children = "Sign the Pledge",
  onClick,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 w-full max-w-[600px] px-7 py-3 rounded-3xl font-semibold border-0 cursor-pointer transition-colors duration-200 hover:bg-[#4385dbff] ${className}`}
      style={{
        background: "var(--brand-primary)",
        color: "var(--text-primary)",
      }}
    >
      {children}
      <Image
        src="/assets/icons/sign.svg"
        alt="Sign icon"
        width={20}
        height={20}
        className="object-contain"
      />
    </button>
  );
}

export function SignFrameworkButton({
  children = "Sign the Community Framework",
  onClick,
  className = "",
}) {
  const handleClick = () => {
    window.open(
      "https://sign-cf.eeg101.eu/",
      "_blank",
    );
    if (onClick) onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center gap-2 px-10 py-4 rounded-3xl font-semibold border-0 cursor-pointer transition-colors duration-200 bg-[#76A6E6] text-black hover:bg-[#4385dbff] ${className}`}
      style={{
        background: "var(--brand-primary)",
        color: "var(--text-primary)",
      }}
    >
      {children}
      <Image
        src="/assets/icons/sign.svg"
        alt="Sign icon"
        width={20}
        height={20}
        className="object-contain"
      />
    </button>
  );
}

export function OriginSourceButton({
  children = "Original Source",
  onClick,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 w-full max-w-[600px] px-8 py-3 rounded-3xl font-semibold border-0 cursor-pointer transition-colors duration-200 ${className}`}
      style={{
        background: "var(--surface-secondary)",
        color: "var(--text-primary)",
      }}
      onMouseEnter={(e) =>
        (e.target.style.backgroundColor = "var(--surface-tertiary)")
      }
      onMouseLeave={(e) =>
        (e.target.style.backgroundColor = "var(--surface-secondary)")
      }
    >
      {children}
      <Image
        src="/assets/icons/arrow.svg"
        alt="Arrow icon"
        width={16}
        height={16}
        className="object-contain"
      />
    </button>
  );
}

export function ZoteroLinkButton({
  children = "View in Zotero",
  onClick,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 w-full max-w-[600px] px-8 py-3 rounded-3xl font-semibold border-0 cursor-pointer transition-colors duration-200 ${className}`}
      style={{
        background: "var(--surface-secondary)",
        color: "var(--text-primary)",
      }}
      onMouseEnter={(e) =>
        (e.target.style.backgroundColor = "var(--surface-tertiary)")
      }
      onMouseLeave={(e) =>
        (e.target.style.backgroundColor = "var(--surface-secondary)")
      }
    >
      {children}
      <Image
        src="/assets/icons/zotero.png"
        alt="Zotero icon"
        width={16}
        height={16}
        className="object-contain"
      />
    </button>
  );
}
