import Link from "next/link";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
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
        <Link href="/" className="text-lg font-semibold text-gray-900">
          The Lost and Found Project
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-gray-900">
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-white hover:bg-gray-700"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
