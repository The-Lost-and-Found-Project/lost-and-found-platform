import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import AppFrame from "@/components/AppFrame";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "The Lost and Found Project",
  description: "The official ministry platform for The Lost and Found Project.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <AppFrame header={<Header />}>{children}</AppFrame>
      </body>
    </html>
  );
}
