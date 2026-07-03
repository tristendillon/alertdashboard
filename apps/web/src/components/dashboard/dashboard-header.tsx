"use client";

import { Search, Bell, Menu, Sidebar } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useRef, useEffect, useState } from "react";
import { useModalState } from "@/hooks/nuqs/use-modal-state";
import { Modals } from "@/lib/enums";
export function DashboardHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const initialOffsetTop = useRef<number>(0);
  const [, setModal] = useModalState();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    // Store the initial position of the header
    if (headerRef.current) {
      initialOffsetTop.current = headerRef.current.offsetTop;
    }

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          const shouldBeSticky = scrollTop > initialOffsetTop.current;

          // Only update state if it actually changed to prevent unnecessary re-renders
          setIsSticky((current) =>
            current !== shouldBeSticky ? shouldBeSticky : current,
          );

          ticking = false;
        });
        ticking = true;
      }
    };

    // Add scroll event listener with passive option for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className={`bg-background flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-all duration-200 ${
        isSticky ? "sticky top-0 right-0 left-0 z-50 shadow-md" : "relative"
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <Breadcrumbs />

        <div className="flex items-center gap-2">
          {/* Desktop view - show all buttons */}
          <div className="hidden items-center gap-2 sm:flex">
            <div
              onClick={() => setModal(Modals.SEARCH)}
              className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
            >
              <Search className="size-4" />
              <span>Search</span>
            </div>

            <div
              onClick={() => setModal(Modals.NOTIFICATIONS)}
              className="hover:bg-accent hover:text-accent-foreground relative flex cursor-pointer items-center justify-center rounded-md p-2 transition-colors"
            >
              <Bell className="size-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 items-center justify-center rounded-full bg-red-500 text-center text-xs text-white">
                3
              </span>
            </div>

            <SidebarTrigger className="md:hidden" />
          </div>

          {/* Mobile view - dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center justify-center rounded-md p-2 transition-colors sm:hidden">
              <Menu className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setModal(Modals.SEARCH)}>
                <Search className="size-4" />
                Search
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setModal(Modals.NOTIFICATIONS)}>
                <Bell className="size-4" />
                Notifications
                <span className="absolute -top-1 -right-1 h-4 w-4 items-center justify-center rounded-full bg-red-500 text-center text-xs text-white">
                  3
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenMobile(true)}>
                <Sidebar className="size-4" />
                Menu
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
