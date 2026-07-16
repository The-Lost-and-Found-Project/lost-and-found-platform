import Image from "next/image";
import Link from "next/link";
import NotificationBell from "./NotificationBell";
import AuthControls from "./AuthControls";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-journey", label: "My Journey" },
  { href: "/prayer", label: "Prayer" },
  { href: "/studies", label: "Studies" },
  { href: "/mentoring", label: "Mentoring" },
  { href: "/events", label: "Events" },
  { href: "/admin", label: "Admin" },
];

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Image src="/logo.svg" alt="" width={28} height={28} priority />
          <span>The Lost and Found Project</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-gray-900">
              {link.label}
            </Link>
          ))}
          <NotificationBell />
          <AuthControls />
        </nav>
      </div>
    </header>
  );
}
