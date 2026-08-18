import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Emmaus | The Lost and Found Project",
  description: "Scripture reading, guided discovery, and deeper Bible study from The Lost and Found Project.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
