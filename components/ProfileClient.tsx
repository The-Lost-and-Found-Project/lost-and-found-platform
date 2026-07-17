"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

type Props = {
  email: string;
  initialFullName: string;
  initialAvatarUrl: string;
  initialTestimony: string;
  initialFavoriteScripture: string;
  initialDateOfSalvation: string;
  initialDateOfBaptism: string;
};

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
  initialFullName,
  initialAvatarUrl,
  initialTestimony,
  initialFavoriteScripture,
  initialDateOfSalvation,
  initialDateOfBaptism,
}: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    </div>
  );
}
