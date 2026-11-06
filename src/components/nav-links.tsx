"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/sales", label: "Sales" },
  { href: "/calendar", label: "Calendar" },
  { href: "/todos", label: "To-Do" },
  { href: "/events", label: "Events" },
  { href: "/contacts", label: "Contacts" },
  { href: "/inquiries", label: "Inquiries" },
  { href: "/inventory", label: "Inventory" },
  { href: "/cookbook", label: "Cookbook" },
  { href: "/prep", label: "Prep" },
  { href: "/costs", label: "Costs" },
  { href: "/social", label: "Social" },
  { href: "/email", label: "Email" },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
