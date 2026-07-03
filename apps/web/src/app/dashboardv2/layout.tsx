import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardProvider } from "@/providers/dashboard-provider";
import { cookies } from "next/headers";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ModalRouter } from "@/components/modals/modal-router";

export default async function DashboardV2Layout({
  children,
}: LayoutProps<"/dashboardv2">) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <NuqsAdapter>
      <SidebarProvider defaultOpen={defaultOpen}>
        <DashboardProvider>
          <DashboardSidebar />
          <SidebarInset>
            <ModalRouter />
            <DashboardHeader />
            <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
          </SidebarInset>
        </DashboardProvider>
      </SidebarProvider>
    </NuqsAdapter>
  );
}
