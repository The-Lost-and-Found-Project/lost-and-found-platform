"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; name: string };

export default function SubmitPrayerRequestPage() {
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [requestText, setRequestText] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [contactRequested, setContactRequested] = useState(false);
  const [preferredContact, setPreferredContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("prayer_categories")
        .select("id, name")
        .order("sort_order");
      setCategories((data as Category[]) ?? []);
    }
    loadCategories();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const { error: insertError } = await supabase.from("prayer_requests").insert({
      user_id: user ? user.id : null,
      name,
      email,
      phone: phone || null,
      preferred_contact: contactRequested ? preferredContact || null : null,
      category_id: categoryId || null,
      request_text: requestText,
      is_public: isPublic,
      is_anonymous: isAnonymous,
      contact_requested: contactRequested,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Thank you</h1>
        <p className="mt-4 text-gray-600">
          We would be honored to pray with you. Your request has been shared
          with our prayer team.
        </p>
        <a
          href="/prayer"
          className="mt-6 inline-block text-indigo-600 hover:text-indigo-500"
        >
          Back to the Prayer Wall
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Submit a Prayer Request
      </h1>
      <p className="mt-2 text-gray-600">
        We would be honored to pray with you. Share your heart below and our
        prayer team will lift you up.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Your Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone Number (optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Prayer Category
          </label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Your Prayer Request
          </label>
          <textarea
            required
            rows={5}
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-gray-300"
            />
            Allow this prayer request to appear on the Public Prayer Wall
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-gray-300"
            />
            Hide my personal information (my request will appear anonymously)
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={contactRequested}
              onChange={(e) => setContactRequested(e.target.checked)}
              className="rounded border-gray-300"
            />
            Please contact me
          </label>
        </div>

        {contactRequested && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              How would you like to be contacted?
            </label>
            <select
              value={preferredContact}
              onChange={(e) => setPreferredContact(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
            >
              <option value="">Select an option</option>
              <option value="Email">Email</option>
              <option value="Phone Call">Phone Call</option>
              <option value="Text Message">Text Message</option>
            </select>
          </div>
        )}

        <p className="text-xs text-gray-500">
          By submitting this request, you understand that your prayer request
          may be shared with The Lost and Found Project prayer team for the
          purpose of prayer and follow-up. If you do not want your personal
          information visible, select &quot;Hide my personal
          information.&quot; Your request will never be sold or used outside
          the ministry of The Lost and Found Project.
        </p>

        <p className="text-sm text-red-600">{error}</p>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-400 disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Send My Prayer Request"}
        </button>
      </form>
    </div>
  );
}
