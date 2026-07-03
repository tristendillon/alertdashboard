import "./globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { Providers } from "@/providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "MFD Alerts",
  description: "MFD Alerts",
  icons: [{ rel: "icon", type: "image/png", url: "/favicon.png" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} !smooth-scroll bg-background h-screen`}
    >
      <body className="h-full w-full">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
