
import TempNav from "@/components/temp-nav";
import type { Metadata } from "next";
import { UserProvider } from "@workspace/ui/providers/user-provider";
import { SidebarProvider } from '@workspace/ui/components/sidebar';

export const metadata: Metadata = {
  title: "Dashboard | AlertDashboard",
  description: "Dashboard for the alert dashboard app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
      <TempNav />
      <SidebarProvider className="h-[calc(100%-var(--spacing)*16)] overflow-hidden">
        <main className="h-full flex">
          {children}
        </main>
      </SidebarProvider>
    </UserProvider>
  );
}
