"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import { Database, FileText, Home, Key, Shield, Wrench } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/utils/ui";

const DASHBOARD_URL = "/dashboardv2";

// Navigation items
const navigationItems = [
  {
    title: "Dashboard",
    url: DASHBOARD_URL,
    icon: Home,
  },
  {
    title: "View Tokens",
    url: `${DASHBOARD_URL}/view-tokens`,
    icon: Key,
  },
];

const dataManagementItems = [
  {
    title: "Hydrants",
    url: `${DASHBOARD_URL}/hydrants`,
    icon: Database,
  },
  {
    title: "Dispatch Types",
    url: `${DASHBOARD_URL}/dispatch-types`,
    icon: Shield,
  },
];

const transformationItems = [
  {
    title: "Field Transformations",
    url: `${DASHBOARD_URL}/field-transformations`,
    icon: Wrench,
  },
  {
    title: "Transformation Rules",
    url: `${DASHBOARD_URL}/transformation-rules`,
    icon: FileText,
  },
];

export function DashboardSidebar() {
  const { open, toggleSidebar, openMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              {open || openMobile ? (
                <div className="flex items-center gap-2">
                  <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Image
                      src="/logos/logo_256.png"
                      alt="MFD Alerts"
                      width={64}
                      height={64}
                      quality={100}
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      MFD Alert Dashboard
                    </span>
                  </div>
                </div>
              ) : (
                <SidebarMenuButton
                  size="lg"
                  onClick={toggleSidebar}
                  tooltip="Open sidebar"
                  className="flex items-center justify-center"
                >
                  <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Image
                      src="/logos/logo_256.png"
                      alt="MFD Alerts"
                      width={32}
                      height={32}
                      quality={100}
                    />
                  </div>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
          {(open || openMobile) && <SidebarTrigger className="ml-auto" />}
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Data Management */}
        <SidebarGroup>
          <SidebarGroupLabel>Data Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dataManagementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Transformations */}
        <SidebarGroup>
          <SidebarGroupLabel>Transformations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {transformationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserButton
              showName={open || openMobile}
              appearance={{
                theme: "clerk",
                elements: {
                  rootBox: "w-full",
                  button: "w-full",
                  userButtonBox: cn(
                    (open || openMobile) && "w-full flex justify-between",
                  ),
                  userButtonOuterIdentifier: "capitalize",
                },
              }}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
