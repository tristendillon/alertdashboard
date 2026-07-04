"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React, { useRef, useEffect, useState } from "react";

export function DashboardHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const initialOffsetTop = useRef<number>(0);

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
        <SidebarTrigger className="md:hidden" />
      </div>
    </header>
  );
}
