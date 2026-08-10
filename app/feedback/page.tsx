import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FeedbackClient from "@/components/FeedbackClient";

export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(124,58,237,0.32),transparent_32rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Feedback</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Help us make the platform serve people better.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Report a problem, describe something confusing, or suggest an improvement. Clear details help the team understand what happened and what should change.</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
          <FeedbackClient
            defaultName={profile?.full_name ?? ""}
            defaultEmail={profile?.email ?? user.email ?? ""}
          />
        </section>
      </div>
    </main>
  );
}
