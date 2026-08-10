import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "@/components/ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, avatar_url, favorite_scripture, date_of_salvation, date_of_baptism, role, preview_role, ministry_availability, missed_assignment_count, reinstatement_requested_at"
    )
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.trim().split(" ")[0] || "friend";

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(124,58,237,0.3),transparent_32rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.18),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Your Profile</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Your story matters, {firstName}.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Manage the personal details, faith milestones, and account information that shape your experience across The Lost and Found Project.</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/92 shadow-xl">
          <ProfileClient
            email={user.email ?? ""}
            createdAt={user.created_at}
            initialFullName={profile?.full_name ?? ""}
            initialAvatarUrl={profile?.avatar_url ?? ""}
            initialFavoriteScripture={profile?.favorite_scripture ?? ""}
            initialDateOfSalvation={profile?.date_of_salvation ?? ""}
            initialDateOfBaptism={profile?.date_of_baptism ?? ""}
            isRealAdmin={profile?.role === "admin"}
            initialPreviewRole={profile?.preview_role ?? ""}
            isCareTeamMember={["admin", "prayer_team", "pastor"].includes(profile?.role ?? "")}
            initialRotationStatus={profile?.ministry_availability ?? "available"}
            initialMissedAssignmentCount={profile?.missed_assignment_count ?? 0}
            initialReinstatementRequestedAt={profile?.reinstatement_requested_at ?? null}
          />
        </section>
      </div>
    </main>
  );
}
