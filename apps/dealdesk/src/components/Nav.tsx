"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "./ui";

const LINKS: Array<{ href: "/deals" | "/team"; label: string }> = [
  { href: "/deals", label: "Deals" },
  { href: "/team", label: "Team" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((link) => (
        <NavLink
          key={link.href}
          href={link.href}
          active={pathname === link.href || pathname.startsWith(`${link.href}/`)}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
