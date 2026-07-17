import Image from "next/image";
import Link from "next/link";
import BackButton from "./BackButton";
import NotificationBell from "./NotificationBell";
import AuthControls from "./AuthControls";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <BackButton />
          <Link
            href="/"
            aria-label="Home"
            className="flex items-center gap-2 rounded-full p-1.5 transition hover:bg-gray-100"
          >
            <Image
              src="/logo.svg"
              alt="The Lost and Found Project"
              width={32}
              height={32}
              priority
            />
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <NotificationBell />
          <AuthControls />
        </div>
      </div>
    </header>
  );
}
