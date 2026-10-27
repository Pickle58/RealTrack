import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PageShell } from "@/components/layout/PageShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Real Estate Tracker",
  description: "Browse active listings and manage the properties you represent.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={inter.variable} lang="en">
      <body className="font-sans antialiased">
        <PageShell>{children}</PageShell>
      </body>
    </html>
  );
}
