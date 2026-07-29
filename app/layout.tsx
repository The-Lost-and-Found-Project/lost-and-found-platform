import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import RotationStatusModal from "@/components/RotationStatusModal";
import UpdateNotifier from "@/components/UpdateNotifier";

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
        <Header />
        <main id="main-content" className="pb-24" tabIndex={-1}>
          {children}
        </main>
        <BottomNav />
        <RotationStatusModal />
        <UpdateNotifier />
      </body>
    </html>
  );
}
