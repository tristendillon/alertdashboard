"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

// Define route mappings for breadcrumbs
const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/view-tokens": "View Tokens",
  "/dashboard/dispatch-types": "Dispatch Types",
  "/dashboard/field-transformations": "Field Transformations",
  "/dashboard/transformation-rules": "Transformation Rules",
  "/dashboard/settings": "Settings",
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
  if (pathname.startsWith("/dashboard")) {
    breadcrumbs.push({
      label: "Dashboard",
      href: "/dashboard",
      isLast: pathname === "/dashboard",
    });
  }

  // Build path segments
  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;

    // Skip the base dashboard segment since we already added it
    if (currentPath === "/dashboard") continue;

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
