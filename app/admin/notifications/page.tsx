import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendAdminNotification } from "./actions";

const audienceLabels: Record<string, string> = {
  all: "All members",
  ministry: "Ministry followers",
  leaders: "Ministry leaders",
  admins: "Administrators",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fadmin%2Fnotifications");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.is_active || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const {
    data: campaigns,
    error: campaignsError,
  } = await supabase
    .from("notification_campaigns")
    .select(
      "id, title, body, link, audience_type, audience_value, recipient_count, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(30);

  if (campaignsError) {
    throw new Error("Unable to load notification history.");
  }

  return (
    <main className="lfp-page pb-24">
      <section className="bg-slate-950 text-white">
        <div className="lfp-shell py-10">
          <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">
            Communications
          </p>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">
            Notification Center
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Send a message to a specific ministry audience or the whole
            community. Notifications appear in the app; the existing delivery
            webhook separately attempts home-screen push.
          </p>
        </div>
      </section>

      <div className="lfp-shell grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="compose-heading">
          <form
            action={sendAdminNotification}
            className="lfp-card grid gap-5 p-6"
          >
            <div>
              <p className="lfp-eyebrow">Compose</p>
              <h2 id="compose-heading" className="mt-2 text-2xl font-black">
                New notification
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Review the audience and message before sending. Broadcasts are
                delivered immediately.
              </p>
            </div>

            <label className="text-sm font-bold">
              Title
              <input
                required
                maxLength={120}
                name="title"
                placeholder="Tonight’s gathering"
                className="mt-1 w-full rounded-xl border p-3"
              />
            </label>

            <label className="text-sm font-bold">
              Message
              <textarea
                required
                maxLength={500}
                name="body"
                rows={5}
                placeholder="Write the message members should see..."
                className="mt-1 w-full rounded-xl border p-3"
              />
              <span className="mt-1 block font-normal text-slate-500">
                Up to 500 characters.
              </span>
            </label>

            <label className="text-sm font-bold">
              Destination when tapped{" "}
              <span className="font-normal text-slate-500">(optional)</span>
              <input
                name="link"
                placeholder="/events"
                aria-describedby="destination-help"
                className="mt-1 w-full rounded-xl border p-3"
              />
              <span
                id="destination-help"
                className="mt-1 block font-normal text-slate-500"
              >
                Use an internal L&amp;F page path, such as /events.
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Audience
                <select
                  name="audience"
                  defaultValue="all"
                  className="mt-1 w-full rounded-xl border p-3"
                >
                  <option value="all">All Members</option>
                  <option value="ministry">Ministry Followers</option>
                  <option value="leaders">Ministry Leaders</option>
                  <option value="admins">Administrators</option>
                </select>
              </label>

              <label className="text-sm font-bold">
                Ministry{" "}
                <span className="font-normal text-slate-500">
                  (for ministry audiences)
                </span>
                <select
                  name="ministry"
                  defaultValue=""
                  className="mt-1 w-full rounded-xl border p-3"
                >
                  <option value="">All ministries / not applicable</option>
                  <option value="hearth">The Hearth</option>
                  <option value="foundry">The Foundry</option>
                  <option value="mens-study">Men&apos;s Study</option>
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <p className="font-black text-amber-950">
                Full-community broadcast confirmation
              </p>
              <p
                id="broadcast-confirm-help"
                className="mt-1 text-sm text-amber-950/80"
              >
                Sending to All Members requires the exact phrase{" "}
                <strong>SEND TO ALL</strong>. Other audiences do not use this
                confirmation.
              </p>
              <label className="mt-3 block text-sm font-bold text-amber-950">
                Type SEND TO ALL to confirm a community-wide send
                <input
                  name="confirm"
                  aria-describedby="broadcast-confirm-help"
                  placeholder="SEND TO ALL"
                  className="mt-1 w-full rounded-xl border border-amber-300 bg-white p-3"
                />
              </label>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                Delivery
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The app creates an in-app notification for each active matched
                recipient. The existing webhook then records whether push
                delivery was sent, skipped, or failed.
              </p>
            </div>

            <button className="lfp-button bg-indigo-700 text-white">
              Send Notification
            </button>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="lfp-card p-5" aria-labelledby="destinations-heading">
            <p className="lfp-eyebrow">Quick destinations</p>
            <h2 id="destinations-heading" className="sr-only">
              Common L&amp;F page paths
            </h2>
            <div className="mt-3 grid gap-2 text-sm">
              {[
                "/events",
                "/prayer",
                "/praise",
                "/testimonies",
                "/studies",
                "/ministries/hearth",
                "/ministries/foundry",
                "/ministries/mens-study",
              ].map((path) => (
                <code
                  key={path}
                  className="rounded-lg bg-slate-50 px-3 py-2 text-slate-800"
                >
                  {path}
                </code>
              ))}
            </div>
          </section>
        </aside>

        <section
          className="lg:col-span-2"
          aria-labelledby="history-heading"
        >
          <p className="lfp-eyebrow">History</p>
          <h2 id="history-heading" className="mt-2 text-2xl font-black">
            Recent broadcasts
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Showing the 30 most recent admin broadcasts. Times are Eastern.
          </p>

          <div className="mt-4 grid gap-3">
            {campaigns?.length ? (
              campaigns.map((campaign) => (
                <article key={campaign.id} className="lfp-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black">{campaign.title}</h3>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
                        {campaign.body}
                      </p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-800">
                      {campaign.recipient_count.toLocaleString()} recipients
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {audienceLabels[campaign.audience_type] ??
                      campaign.audience_type}
                    {campaign.audience_value
                      ? ` · ${campaign.audience_value}`
                      : ""}
                    {" · "}
                    {formatDate(campaign.created_at)}
                  </p>
                </article>
              ))
            ) : (
              <div className="lfp-card p-6 text-slate-600" role="status">
                No admin broadcasts have been sent yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
