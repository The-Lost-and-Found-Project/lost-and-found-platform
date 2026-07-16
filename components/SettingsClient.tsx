"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Settings = {
  email_notifications: boolean;
  prayer_reaction_notifications: boolean;
  default_anonymous: boolean;
};

export default function SettingsClient({
  initialSettings,
}: {
  initialSettings: Settings;
}) {
  const supabase = createClient();
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function updateSetting(key: keyof Settings, value: boolean) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSaving(key);

    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) {
      setSaving(null);
      return;
    }

    await supabase
      .from("user_settings")
      .update({ [key]: value })
      .eq("user_id", user.id);

    setSaving(null);
    setSavedAt(Date.now());
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        Settings
      </h1>
      <p className="mt-2 text-gray-600">
        Control how The Lost and Found Project notifies you and shares your
        information.
      </p>

      <div className="mt-8 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <ToggleRow
          title="Prayer notifications"
          description="Get notified in-app when someone prays for your request."
          checked={settings.prayer_reaction_notifications}
          onChange={(v) => updateSetting("prayer_reaction_notifications", v)}
          busy={saving === "prayer_reaction_notifications"}
        />
        <ToggleRow
          title="Email notifications"
          description="Receive occasional email updates from the care team."
          checked={settings.email_notifications}
          onChange={(v) => updateSetting("email_notifications", v)}
          busy={saving === "email_notifications"}
        />
        <ToggleRow
          title="Submit prayers anonymously by default"
          description='Pre-check "Hide my personal information" whenever you submit a new prayer request.'
          checked={settings.default_anonymous}
          onChange={(v) => updateSetting("default_anonymous", v)}
          busy={saving === "default_anonymous"}
        />
      </div>

      <p
        className={`mt-3 text-sm text-gray-500 transition ${
          savedAt ? "opacity-100" : "opacity-0"
        }`}
      >
        Saved.
      </p>

      <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">
          Need to update your login or personal info? Head to{" "}
          <a
            href="/account"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Account
          </a>{" "}
          or{" "}
          <a
            href="/profile"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Profile
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  busy,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-5">
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={busy}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${
          checked
            ? "bg-gradient-to-r from-indigo-600 to-violet-600"
            : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
