"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SignOutButton from "@/components/SignOutButton";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

type Props = {
  email: string;
  createdAt: string;
  initialFullName: string;
  initialAvatarUrl: string;
  initialTestimony: string;
  initialFavoriteScripture: string;
  initialDateOfSalvation: string;
  initialDateOfBaptism: string;
  isRealAdmin?: boolean;
  initialPreviewRole?: string;
};

const PREVIEW_OPTIONS: { value: string; label: string; description: string }[] = [
  {
    value: "",
    label: "Community Admin (no preview)",
    description: "See the app as yourself, with full admin access.",
  },
  {
    value: "member",
    label: "Community Member",
    description: "See the app as a Community Member would.",
  },
  {
    value: "prayer_team",
    label: "Community Prayer Member",
    description: "See the app as a Community Prayer Member would.",
  },
];

type Snapshot = {
  fullName: string;
  testimony: string;
  favoriteScripture: string;
  dateOfSalvation: string;
  dateOfBaptism: string;
};

// Parses a "YYYY-MM-DD" date input value into a friendly, timezone-safe
// display string (avoids the classic off-by-one-day bug from `new
// Date("YYYY-MM-DD")` being interpreted as UTC midnight).
function formatDate(value: string) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfileClient({
  email,
  createdAt,
  initialFullName,
  initialAvatarUrl,
  initialTestimony,
  initialFavoriteScripture,
  initialDateOfSalvation,
  initialDateOfBaptism,
  isRealAdmin = false,
  initialPreviewRole = "",
}: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resetStatus, setResetStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  async function handleResetPassword() {
    setResetStatus("sending");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setResetStatus(error ? "error" : "sent");
  }

  const [previewRole, setPreviewRole] = useState(initialPreviewRole);
  const [savingPreview, setSavingPreview] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  const [fullName, setFullName] = useState(initialFullName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [testimony, setTestimony] = useState(initialTestimony);
  const [favoriteScripture, setFavoriteScripture] = useState(
    initialFavoriteScripture
  );
  const [dateOfSalvation, setDateOfSalvation] = useState(
    initialDateOfSalvation
  );
  const [dateOfBaptism, setDateOfBaptism] = useState(initialDateOfBaptism);

  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const initial = (fullName || email || "?").trim().charAt(0).toUpperCase();

  function handleEdit() {
    setSnapshot({
      fullName,
      testimony,
      favoriteScripture,
      dateOfSalvation,
      dateOfBaptism,
    });
    setJustSaved(false);
    setIsEditing(true);
  }

  function handleCancel() {
    if (snapshot) {
      setFullName(snapshot.fullName);
      setTestimony(snapshot.testimony);
      setFavoriteScripture(snapshot.favoriteScripture);
      setDateOfSalvation(snapshot.dateOfSalvation);
      setDateOfBaptism(snapshot.dateOfBaptism);
    }
    setAvatarError("");
    setIsEditing(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          faith_story: testimony.trim() || null,
          favorite_scripture: favoriteScripture.trim() || null,
          date_of_salvation: dateOfSalvation || null,
          date_of_baptism: dateOfBaptism || null,
        })
        .eq("id", user.id);
    }

    setSaving(false);
    setIsEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarError("");

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be 5MB or smaller.");
      return;
    }

    setUploadingAvatar(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploadingAvatar(false);
      setAvatarError("You need to be signed in to upload a photo.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setUploadingAvatar(false);
      setAvatarError("Upload failed. Please try again.");
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    // Cache-bust so the new photo shows immediately even though the
    // filename (and therefore URL) stays the same between uploads.
    const freshUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    await supabase
      .from("profiles")
      .update({ avatar_url: freshUrl })
      .eq("id", user.id);

    setAvatarUrl(freshUrl);
    setUploadingAvatar(false);
  }

  async function handleRemoveAvatar() {
    setAvatarError("");
    setUploadingAvatar(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);
    }

    setAvatarUrl("");
    setUploadingAvatar(false);
  }

  // Lets a real admin preview the app as another role, purely for
  // training/QA. This only ever touches preview_role, never the real role
  // column, so there's no way to get locked out and no privilege escalation
  // risk for non-admins (the server ignores preview_role unless the caller's
  // real role is already admin — see lib/effective-role.ts).
  async function handlePreviewChange(value: string) {
    setPreviewRole(value);
    setSavingPreview(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ preview_role: value || null })
        .eq("id", user.id);
    }

    setSavingPreview(false);
  }

  const avatarImage = avatarUrl ? (
    <img
      src={avatarUrl}
      alt=""
      className="h-16 w-16 rounded-full object-cover"
    />
  ) : (
    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-medium text-white">
      {initial}
    </span>
  );

  const fields = [
    {
      label: "Favorite Bible Verse",
      value: favoriteScripture,
      empty: "Not set",
    },
    {
      label: "Date of Salvation",
      value: formatDate(dateOfSalvation),
      empty: "Not set",
    },
    {
      label: "Date of Baptism",
      value: formatDate(dateOfBaptism),
      empty: "Not set",
    },
    {
      label: "My Testimony",
      value: testimony,
      empty: "No testimony shared yet.",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <p className="mt-2 text-gray-600">
        Manage your account details and how you appear across the app.
      </p>

      {isRealAdmin && (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Preview as a role
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            See what the app looks like for a Community Member or Community
            Prayer Member — handy for training. This only changes what you
            see; your real admin access is never affected, and you can switch
            back any time.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {PREVIEW_OPTIONS.map((option) => {
              const isSelected = (previewRole || "") === option.value;
              return (
                <button
                  key={option.value || "admin"}
                  type="button"
                  disabled={savingPreview}
                  onClick={() => handlePreviewChange(option.value)}
                  className={`flex-1 rounded-md border px-3 py-2 text-left text-sm shadow-sm transition disabled:opacity-50 ${
                    isSelected
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="block font-medium">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          {previewRole && (
            <p className="mt-3 text-xs font-medium text-amber-600">
              Currently previewing as{" "}
              {PREVIEW_OPTIONS.find((o) => o.value === previewRole)?.label ??
                previewRole}
              . Other pages and your profile menu will reflect this until you
              switch back to Admin above.
            </p>
          )}
        </div>
      )}

      <div className="mt-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {avatarImage}
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Add your name"
                  className="block rounded-md border border-gray-300 px-2 py-1 text-sm font-medium text-gray-900 shadow-sm"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {fullName || "Add your name"}
                </p>
              )}
              <p className="text-sm text-gray-500">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {justSaved && !isEditing && (
              <span className="text-sm text-green-600">Saved.</span>
            )}
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="profile-form"
                  disabled={saving}
                  className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleEdit}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">
              Profile picture
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
              >
                {uploadingAvatar
                  ? "Uploading..."
                  : avatarUrl
                  ? "Change Photo"
                  : "Upload Photo"}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="text-sm font-medium text-red-600 transition hover:text-red-500 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
            {avatarError && (
              <p className="mt-1 text-xs text-red-600">{avatarError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">JPG or PNG, up to 5MB.</p>
          </div>
        )}

        <form
          id="profile-form"
          onSubmit={handleSave}
          className="mt-6 divide-y divide-gray-100 border-t border-gray-100"
        >
          {isEditing ? (
            <div className="space-y-5 py-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Favorite Bible Verse
                </label>
                <input
                  type="text"
                  value={favoriteScripture}
                  onChange={(e) => setFavoriteScripture(e.target.value)}
                  placeholder="e.g. Philippians 4:13"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-5">
                <div className="flex-1 min-w-[10rem]">
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Salvation
                  </label>
                  <input
                    type="date"
                    value={dateOfSalvation}
                    onChange={(e) => setDateOfSalvation(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
                  />
                </div>
                <div className="flex-1 min-w-[10rem]">
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Baptism
                  </label>
                  <input
                    type="date"
                    value={dateOfBaptism}
                    onChange={(e) => setDateOfBaptism(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  My Testimony
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Share what God has done in your life. If you save a
                  testimony, it will appear anonymously in the &ldquo;Testimonies
                  From Our Community&rdquo; ticker on the Dashboard — your name
                  is never shown. Leave this blank to remove it from the
                  ticker.
                </p>
                <textarea
                  rows={6}
                  value={testimony}
                  onChange={(e) => setTestimony(e.target.value)}
                  placeholder="Share your testimony here..."
                  className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
                />
              </div>
            </div>
          ) : (
            fields.map((field) => (
              <div key={field.label} className="py-4 first:pt-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {field.label}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                  {field.value || (
                    <span className="text-gray-400">{field.empty}</span>
                  )}
                </p>
              </div>
            ))
          )}
        </form>
      </div>

      <div className="mt-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Account</h2>
        <p className="mt-1 text-xs text-gray-500">
          Your login details and account security.
        </p>

        <div className="mt-5 space-y-5 divide-y divide-gray-100">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Member since
            </p>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="pt-5">
            <p className="text-sm font-medium text-gray-900">Password</p>
            <p className="mt-1 text-sm text-gray-600">
              Send yourself a secure link to reset your password.
            </p>
            <button
              onClick={handleResetPassword}
              disabled={resetStatus === "sending" || resetStatus === "sent"}
              className="mt-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
            >
              {resetStatus === "sent"
                ? "Reset link sent"
                : resetStatus === "sending"
                ? "Sending..."
                : "Send password reset email"}
            </button>
            {resetStatus === "error" && (
              <p className="mt-2 text-sm text-red-600">
                Something went wrong. Please try again.
              </p>
            )}
          </div>

          <div className="pt-5">
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
