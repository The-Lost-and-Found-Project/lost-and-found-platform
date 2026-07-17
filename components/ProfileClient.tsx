"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

type Props = {
  email: string;
  initialFullName: string;
  initialAvatarUrl: string;
  initialTestimony: string;
};

export default function ProfileClient({
  email,
  initialFullName,
  initialAvatarUrl,
  initialTestimony,
}: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(initialFullName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const [testimony, setTestimony] = useState(initialTestimony);
  const [savingTestimony, setSavingTestimony] = useState(false);
  const [savedTestimony, setSavedTestimony] = useState(false);

  const initial = (fullName || email || "?").trim().charAt(0).toUpperCase();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          avatar_url: avatarUrl || null,
        })
        .eq("id", user.id);
    }

    setSaving(false);
    setSaved(true);
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

  async function handleSaveTestimony(e: React.FormEvent) {
    e.preventDefault();
    setSavingTestimony(true);
    setSavedTestimony(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({
          faith_story: testimony.trim() || null,
        })
        .eq("id", user.id);
    }

    setSavingTestimony(false);
    setSavedTestimony(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <p className="mt-2 text-gray-600">
        Manage your account details and how you appear across the app.
      </p>

      <div className="mt-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-medium text-white">
              {initial}
            </span>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {fullName || "Add your name"}
            </p>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
            />
          </div>

          <div>
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

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-400 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {saved && <span className="text-sm text-green-600">Saved.</span>}
          </div>
        </form>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">My Testimony</h2>
        <p className="mt-1 text-sm text-gray-600">
          Share what God has done in your life. If you save a testimony, it
          will appear anonymously in the &ldquo;Testimonies From Our
          Community&rdquo; ticker on the Dashboard — your name is never shown.
        </p>

        <form onSubmit={handleSaveTestimony} className="mt-4 space-y-3">
          <textarea
            rows={6}
            value={testimony}
            onChange={(e) => setTestimony(e.target.value)}
            placeholder="Share your testimony here..."
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
          />
          <p className="text-xs text-gray-500">
            Leave this blank and save to remove your testimony from the
            community ticker.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingTestimony}
              className="rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
            >
              {savingTestimony ? "Saving..." : "Save Testimony"}
            </button>
            {savedTestimony && (
              <span className="text-sm text-green-600">Saved.</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
