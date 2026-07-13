import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

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
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
