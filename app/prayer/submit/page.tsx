"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TurnstileWidget from "@/components/TurnstileWidget";

type Category = {
  id: string;
  name: string;
  default_care_level: string | null;
  route_to: string | null;
};

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
  const [preferredCareGender, setPreferredCareGender] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("prayer_categories")
        .select("id, name, default_care_level, route_to")
        .order("sort_order");
      setCategories((data as Category[]) ?? []);
    }
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);

  useEffect(() => {
    // For signed-in members, pre-fill their name/email from their profile
    // so they don't have to re-type info we already have, and pre-fill the
    // anonymous checkbox from their saved Settings preference.
    async function loadSignedInDefaults() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const [{ data: profile }, { data: settings }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single(),
        supabase
          .from("user_settings")
          .select("default_anonymous")
          .eq("user_id", user.id)
          .single(),
      ]);

      if (profile?.full_name) setName(profile.full_name);
      if (user.email) setEmail(user.email);
      if (profile?.full_name || user.email) setPrefilledFromProfile(true);

      if (settings?.default_anonymous) {
        setIsAnonymous(true);
      }
    }
    loadSignedInDefaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
      setError("Please complete the CAPTCHA challenge before submitting.");
      return;
    }

    setSubmitting(true);

    const captchaCheck = await fetch("/api/verify-turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: captchaToken }),
    }).then((r) => r.json());

    if (!captchaCheck.success) {
      setError(
        captchaCheck.error ?? "CAPTCHA verification failed. Please try again."
      );
      setSubmitting(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    // Generate the id ourselves so we can look up the auto-assignment
    // afterward without needing to read the row back (private, anonymous
    // submissions aren't visible to the submitter under RLS, so a
    // `.select()` on the insert would fail even though it succeeded).
    const newRequestId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : undefined;

    const { error: insertError } = await supabase.from("prayer_requests").insert({
      ...(newRequestId ? { id: newRequestId } : {}),
      user_id: user ? user.id : null,
      name,
      email,
      phone: phone || null,
      preferred_contact: contactRequested ? preferredContact || null : null,
      preferred_care_gender: contactRequested
        ? preferredCareGender || null
        : null,
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

    // Admins get a lightweight, email-only heads-up for every new request
    // (no in-app push, and not sent to the wider care team - that broadcast
    // was retired as noisy). The care team as a whole still sees new
    // requests in the weekly rolled-up digest email.
    const category = categories.find((c) => c.id === categoryId);
    fetch("/api/notify-new-request-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        categoryName: category?.name ?? null,
        requestText,
        isPublic,
        isAnonymous,
        contactRequested,
      }),
    }).catch((err) => {
      console.error("Failed to send admin new-request notification:", err);
    });

    // A separate DB trigger auto-assigns this request to the next care team
    // member in the rotation. Look that assignment up (via a narrow RPC that
    // only ever returns the assignee's id) and fire the same "you've been
    // matched" email the admin dashboard sends for manual assignments, so
    // the assignee finds out right away instead of waiting for the weekly
    // digest. This in-app notification + email is unaffected by the change
    // above and still fires normally.
    if (newRequestId) {
      const { data: assignedTo } = await supabase.rpc(
        "get_prayer_request_assignment",
        { request_id: newRequestId }
      );

      if (assignedTo) {
        fetch("/api/notify-assignment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assigneeId: assignedTo,
            name,
            email,
            phone,
            preferredContact,
            categoryName: category?.name ?? null,
            requestText,
            isPublic,
            isAnonymous,
            contactRequested,
          }),
        }).catch((err) => {
          console.error("Failed to send assignment notification:", err);
        });
      }
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
          {prefilledFromProfile && (
            <p className="mt-1 text-xs text-gray-400">
              Filled in from your profile. Edit it if this request is on
              someone else&apos;s behalf.
            </p>
          )}
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
          <p className="mt-1 text-xs text-gray-500">
            Out of respect for others&apos; privacy, please avoid including
            other people&apos;s full names or personal details (addresses,
            medical, legal, or financial information) without their
            permission. Referring to someone as &quot;my brother&quot; or
            &quot;a friend at work&quot; is perfectly fine.
          </p>
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

        {contactRequested && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Preferred care team gender (optional)
            </label>
            <select
              value={preferredCareGender}
              onChange={(e) => setPreferredCareGender(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
            >
              <option value="">No preference</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              If you&apos;d feel more comfortable being contacted by someone
              of a specific gender, let us know here.
            </p>
          </div>
        )}

        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">
          <p>
            By submitting this request, you understand that your prayer
            request may be shared with The Lost and Found Project prayer team
            for the purpose of prayer and follow-up. If you do not want your
            personal information visible, select &quot;Hide my personal
            information.&quot; Your request will never be sold or used
            outside the ministry of The Lost and Found Project.
          </p>
          <p className="mt-2">
            To keep this a safe space, submissions may not include
            harassment, threats, or aggressive language; sexual content or
            advances; hate speech; or other abusive language. Requests are
            reviewed and may be edited, held for review, or declined at our
            discretion if they don&apos;t meet these guidelines.
          </p>
          <p className="mt-2">
            This form is not monitored for emergencies and is not a
            substitute for professional medical, legal, or mental health
            care. If you or someone else is in immediate danger, please call
            911. If you&apos;re in crisis or thinking about suicide, you can
            reach the 988 Suicide &amp; Crisis Lifeline by calling or texting
            988, any time.
          </p>
        </div>

        <TurnstileWidget onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />

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
