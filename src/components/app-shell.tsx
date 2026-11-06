"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLinks } from "@/components/nav-links";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";
import { logout } from "@/app/login/actions";

export function AppShell({
  userEmail,
  children,
}: {
  userEmail?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <div className="flex items-center justify-between border-b bg-muted/30 p-4 md:hidden">
        <BrandMark />
        <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex-col justify-between border-r bg-background p-4 md:static md:flex md:w-56 md:bg-muted/30",
          open ? "flex" : "hidden",
        )}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <BrandMark className="px-3" />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
        <div className="flex flex-col gap-2 px-3">
          <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
          <form action={logout}>
            <Button variant="outline" size="sm" type="submit" className="w-full">
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-x-auto p-6">{children}</main>
    </div>
  );
}
