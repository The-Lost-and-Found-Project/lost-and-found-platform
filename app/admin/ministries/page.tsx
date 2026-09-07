import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ministryPortals } from "@/lib/ministry-hub";
import { createMinistryContent, deleteMinistryContent, toggleMinistryContent } from "./actions";

export default async function AdminMinistriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single(); if (profile?.role !== "admin") redirect("/dashboard");
  const { data: items } = await supabase.from("ministry_content").select("*").order("created_at", { ascending: false });
  return <main className="lfp-page pb-24"><div className="lfp-shell py-10">
    <Link href="/admin" className="text-sm font-black text-indigo-700">← Admin Center</Link>
    <p className="lfp-eyebrow mt-6">Ministry CMS</p><h1 className="mt-2 text-4xl font-black text-slate-950">Manage the Ministry Hub</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">Publish announcements, resources, gatherings, studies, and service opportunities without changing application code.</p>
    <section className="mt-8 grid gap-4 md:grid-cols-3">{ministryPortals.map(m => <Link key={m.slug} href={`/ministries/${m.slug}`} className="lfp-card p-5"><span className="text-2xl">{m.icon}</span><h2 className="mt-3 text-xl font-black">{m.title}</h2><p className="mt-1 text-sm text-slate-600">Preview member portal →</p></Link>)}</section>
    <details open className="lfp-card mt-8 p-6"><summary className="cursor-pointer text-xl font-black">Add ministry content</summary><form action={createMinistryContent} className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="font-bold text-sm">Ministry<select name="ministry_slug" className="mt-1 w-full rounded-xl border p-3">{ministryPortals.map(m => <option key={m.slug} value={m.slug}>{m.title}</option>)}</select></label>
      <label className="font-bold text-sm">Type<select name="content_type" className="mt-1 w-full rounded-xl border p-3"><option value="announcement">Announcement</option><option value="gathering">Gathering</option><option value="resource">Resource</option><option value="study">Study</option><option value="serve">Serve opportunity</option></select></label>
      <label className="font-bold text-sm sm:col-span-2">Title<input required name="title" className="mt-1 w-full rounded-xl border p-3" /></label>
      <label className="font-bold text-sm sm:col-span-2">Summary<textarea name="summary" rows={2} className="mt-1 w-full rounded-xl border p-3" /></label>
      <label className="font-bold text-sm sm:col-span-2">Details<textarea name="body" rows={5} className="mt-1 w-full rounded-xl border p-3" /></label>
      <label className="font-bold text-sm">Link<input name="link_url" type="url" placeholder="https://..." className="mt-1 w-full rounded-xl border p-3" /></label><label className="font-bold text-sm">Date / time<input name="starts_at" type="datetime-local" className="mt-1 w-full rounded-xl border p-3" /></label>
      <div className="flex gap-5 sm:col-span-2"><label className="flex items-center gap-2 font-bold"><input name="is_published" type="checkbox" /> Publish now</label><label className="flex items-center gap-2 font-bold"><input name="is_featured" type="checkbox" /> Feature</label></div><button className="lfp-button bg-slate-950 text-white sm:col-span-2">Add content</button>
    </form></details>
    <section className="mt-8"><h2 className="text-2xl font-black">Content library</h2><div className="mt-4 space-y-3">{(items ?? []).length === 0 ? <div className="lfp-card p-6 text-slate-600">No ministry content yet.</div> : (items ?? []).map((item:any) => <article key={item.id} className="lfp-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2 text-xs font-black uppercase"><span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-800">{item.ministry_slug}</span><span className="rounded-full bg-slate-100 px-2 py-1">{item.content_type}</span><span className={`rounded-full px-2 py-1 ${item.is_published ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{item.is_published ? "Published" : "Draft"}</span></div><h3 className="mt-2 text-lg font-black">{item.title}</h3>{item.summary && <p className="mt-1 text-slate-600">{item.summary}</p>}</div><div className="flex gap-2"><form action={toggleMinistryContent}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="ministry_slug" value={item.ministry_slug}/><input type="hidden" name="is_published" value={String(item.is_published)}/><button className="rounded-xl border px-3 py-2 text-sm font-bold">{item.is_published ? "Unpublish" : "Publish"}</button></form><form action={deleteMinistryContent}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="ministry_slug" value={item.ministry_slug}/><button className="rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-700">Delete</button></form></div></div></article>)}</div></section>
  </div></main>;
}
