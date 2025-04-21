
import TempNav from "@/components/temp-nav";
import type { Metadata } from "next";

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
    <main className="h-full">
      <TempNav/>
      {children}
    </main>
  );
}
