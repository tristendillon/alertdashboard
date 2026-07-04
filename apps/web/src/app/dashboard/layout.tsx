import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { EntityDrawer } from "@/components/dashboard/entity-drawer";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <NuqsAdapter>
      <SidebarProvider defaultOpen={defaultOpen}>
        <DashboardSidebar />
        <SidebarInset>
          <EntityDrawer />
          <DashboardHeader />
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </NuqsAdapter>
  );
}
