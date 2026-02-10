"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const isActive = (path) => {
    if (path === "/resources") {
      return pathname === "/resources" || pathname.startsWith("/resources/");
    }
    return pathname === path;
  };

  const links = [
    { href: "/", label: "Home" },
    { href: "/resources", label: "Resources" },
    { href: "/about", label: "About us" },
  ];

  return (
    <header className="site-header">
      <div className="header-wrapper">
        <div className="site-branding">
          <Link href="/" className="logo-link">
            <Image
              src="/assets/icons/logo.png"
              alt="logo icon"
              width={300}
              height={84}
              className="site-logo"
              priority
            />
          </Link>
          <Link href="/" className="site-title">
            EEG101 Community Framework Resources Catalog
          </Link>
        </div>

        <nav className="site-navigation">
          <ul className="nav-list">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={active ? "active" : ""}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
