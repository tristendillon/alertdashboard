"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

// Define route mappings for breadcrumbs
const routeLabels: Record<string, string> = {
  "/dashboardv2": "Dashboard",
  "/dashboardv2/view-tokens": "View Tokens",
  "/dashboardv2/hydrants": "Hydrants",
  "/dashboardv2/dispatch-types": "Dispatch Types",
  "/dashboardv2/field-transformations": "Field Transformations",
  "/dashboardv2/transformation-rules": "Transformation Rules",
  "/dashboardv2/settings": "Settings",
};

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [];

  // Always start with Home
  breadcrumbs.push({
    label: "Home",
    href: "/",
    isLast: pathname === "/",
  });

  // Add Dashboard if we're in dashboard routes
  if (pathname.startsWith("/dashboardv2")) {
    breadcrumbs.push({
      label: "Dashboard",
      href: "/dashboardv2",
      isLast: pathname === "/dashboardv2",
    });
  }

  // Build path segments
  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;

    // Skip the base dashboardv2 segment since we already added it
    if (currentPath === "/dashboardv2") continue;

    const label =
      routeLabels[currentPath] ||
      segments[i].replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
    breadcrumbs.push({
      label,
      href: currentPath,
      isLast: i === segments.length - 1,
    });
  }

  return breadcrumbs;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <nav className="text-muted-foreground flex items-center space-x-1 text-sm">
      <Home className="size-4" />
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          {index > 0 && <ChevronRight className="mx-1 size-4" />}
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
