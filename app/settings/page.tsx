import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        Settings
      </h1>
      <p className="mt-2 text-gray-600">
        Notification and app preferences are on the way.
      </p>

      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">
          We&apos;re building out settings for notification preferences,
          privacy, and more. Check back soon &mdash; in the meantime, head to{" "}
          <a
            href="/account"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Account
          </a>{" "}
          to manage your login, or{" "}
          <a
            href="/profile"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Profile
          </a>{" "}
          to update your name and photo.
        </p>
      </div>
    </div>
  );
}
