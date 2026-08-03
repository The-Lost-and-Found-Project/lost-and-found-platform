"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Discovery = {
  discovery_id: string;
  pack_id: string;
  title: string;
  passage: string;
  estimated_minutes: number;
  skill_focus: string[];
};

type MapRow = {
  id: string;
  map_key: string;
  title: string;
  subtitle: string | null;
  description: string;
  cover_icon: string;
  difficulty: "explorer" | "growing" | "deep" | "mentor";
  estimated_minutes: number;
  completion_xp: number;
  status: "draft" | "reviewed" | "published" | "archived";
};

type Stop = {
  id?: string;
  stop_key: string;
  discovery_id: string;
  position: number;
  stop_type: "required" | "optional" | "branch" | "challenge";
  branch_label: string;
  prerequisite_stop_keys: string[];
  transition_prompt: string;
  reflection_prompt: string;
};

const emptyMap: Omit<MapRow, "id"> = {
  map_key: "",
  title: "",
  subtitle: "",
  description: "",
  cover_icon: "🧭",
  difficulty: "growing",
  estimated_minutes: 120,
  completion_xp: 100,
  status: "draft",
};

export default function FounderMapStudio() {
  const supabase = useMemo(() => createClient(), []);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [maps, setMaps] = useState<MapRow[]>([]);
  const [activeMap, setActiveMap] = useState<MapRow | null>(null);
  const [draft, setDraft] = useState(emptyMap);
  const [stops, setStops] = useState<Stop[]>([]);
  const [selectedDiscovery, setSelectedDiscovery] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    const [{ data: catalog }, { data: mapRows }] = await Promise.all([
      supabase.from("emmaus_discovery_catalog").select("discovery_id, pack_id, title, passage, estimated_minutes, skill_focus").order("passage"),
      supabase.from("emmaus_discovery_maps").select("id, map_key, title, subtitle, description, cover_icon, difficulty, estimated_minutes, completion_xp, status").order("updated_at", { ascending: false }),
    ]);
    setDiscoveries((catalog ?? []) as Discovery[]);
    setMaps((mapRows ?? []) as MapRow[]);
  }

  async function openMap(map: MapRow) {
    setActiveMap(map);
    setDraft({
      map_key: map.map_key,
      title: map.title,
      subtitle: map.subtitle ?? "",
      description: map.description,
      cover_icon: map.cover_icon,
      difficulty: map.difficulty,
      estimated_minutes: map.estimated_minutes,
      completion_xp: map.completion_xp,
      status: map.status,
    });
    const { data } = await supabase
      .from("emmaus_discovery_map_stops")
      .select("id, stop_key, discovery_id, position, stop_type, branch_label, prerequisite_stop_keys, transition_prompt, reflection_prompt")
      .eq("map_id", map.id)
      .order("position");
    setStops(((data ?? []) as any[]).map((stop) => ({
      ...stop,
      branch_label: stop.branch_label ?? "",
      transition_prompt: stop.transition_prompt ?? "",
      reflection_prompt: stop.reflection_prompt ?? "",
      prerequisite_stop_keys: stop.prerequisite_stop_keys ?? [],
    })));
    setMessage("");
  }

  function newMap() {
    setActiveMap(null);
    setDraft(emptyMap);
    setStops([]);
    setMessage("");
  }

  function addStop() {
    const discovery = discoveries.find((item) => item.discovery_id === selectedDiscovery);
    if (!discovery || stops.some((stop) => stop.discovery_id === discovery.discovery_id)) return;
    const position = stops.length + 1;
    setStops((current) => [...current, {
      stop_key: `stop-${position}-${discovery.discovery_id}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
      discovery_id: discovery.discovery_id,
      position,
      stop_type: "required",
      branch_label: "",
      prerequisite_stop_keys: position > 1 ? [current[current.length - 1].stop_key] : [],
      transition_prompt: "",
      reflection_prompt: "",
    }]);
    setSelectedDiscovery("");
  }

  function moveStop(index: number, direction: -1 | 1) {
    const next = [...stops];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setStops(next.map((stop, idx) => ({ ...stop, position: idx + 1 })));
  }

  function updateStop(index: number, patch: Partial<Stop>) {
    setStops((current) => current.map((stop, idx) => idx === index ? { ...stop, ...patch } : stop));
  }

  async function saveMap(nextStatus?: MapRow["status"]) {
    if (!draft.title.trim() || !draft.map_key.trim() || !draft.description.trim()) {
      setMessage("Map key, title, and description are required.");
      return;
    }
    setSaving(true);
    setMessage("");
    const payload = {
      ...draft,
      status: nextStatus ?? draft.status,
      map_key: draft.map_key.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
      subtitle: draft.subtitle?.trim() || null,
    };

    let mapId = activeMap?.id;
    if (mapId) {
      const { error } = await supabase.from("emmaus_discovery_maps").update(payload).eq("id", mapId);
      if (error) return finish(error.message);
    } else {
      const { data, error } = await supabase.from("emmaus_discovery_maps").insert(payload).select("id").single();
      if (error) return finish(error.message);
      mapId = data.id;
    }

    const { error: deleteError } = await supabase.from("emmaus_discovery_map_stops").delete().eq("map_id", mapId);
    if (deleteError) return finish(deleteError.message);

    if (stops.length) {
      const { error: stopError } = await supabase.from("emmaus_discovery_map_stops").insert(stops.map((stop, index) => ({
        map_id: mapId,
        stop_key: stop.stop_key,
        discovery_id: stop.discovery_id,
        position: index + 1,
        stop_type: stop.stop_type,
        branch_label: stop.branch_label || null,
        prerequisite_stop_keys: stop.prerequisite_stop_keys,
        transition_prompt: stop.transition_prompt || null,
        reflection_prompt: stop.reflection_prompt || null,
      })));
      if (stopError) return finish(stopError.message);
    }

    setMessage(nextStatus === "published" ? "Discovery Map published." : "Discovery Map saved.");
    await loadData();
    const { data: saved } = await supabase.from("emmaus_discovery_maps").select("id, map_key, title, subtitle, description, cover_icon, difficulty, estimated_minutes, completion_xp, status").eq("id", mapId).single();
    if (saved) setActiveMap(saved as MapRow);
    setDraft((current) => ({ ...current, status: payload.status }));
    setSaving(false);
  }

  function finish(error: string) {
    setMessage(error);
    setSaving(false);
  }

  const totalMinutes = stops.reduce((sum, stop) => sum + (discoveries.find((item) => item.discovery_id === stop.discovery_id)?.estimated_minutes ?? 0), 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
      <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Founder Studio</p><h2 className="mt-1 text-2xl font-black text-slate-950">Discovery Maps</h2></div>
          <button type="button" onClick={newMap} className="rounded-full bg-indigo-600 px-3 py-2 text-sm font-black text-white">New</button>
        </div>
        <div className="mt-5 space-y-3">
          {maps.map((map) => (
            <button key={map.id} type="button" onClick={() => void openMap(map)} className={`w-full rounded-2xl border p-4 text-left ${activeMap?.id === map.id ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-start gap-3"><span className="text-2xl">{map.cover_icon}</span><div><p className="font-black text-slate-950">{map.title}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{map.status}</p></div></div>
            </button>
          ))}
          {!maps.length && <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No maps yet.</p>}
        </div>
      </aside>

      <main className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Map key"><input value={draft.map_key} onChange={(e) => setDraft({ ...draft, map_key: e.target.value })} className={inputClass} placeholder="who-is-jesus" /></Field>
            <Field label="Title"><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={inputClass} placeholder="Who Is Jesus?" /></Field>
            <Field label="Subtitle"><input value={draft.subtitle ?? ""} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} className={inputClass} /></Field>
            <Field label="Icon"><input value={draft.cover_icon} onChange={(e) => setDraft({ ...draft, cover_icon: e.target.value })} className={inputClass} /></Field>
            <Field label="Difficulty"><select value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as MapRow["difficulty"] })} className={inputClass}><option value="explorer">Explorer</option><option value="growing">Growing</option><option value="deep">Deep</option><option value="mentor">Mentor</option></select></Field>
            <Field label="Completion XP"><input type="number" value={draft.completion_xp} onChange={(e) => setDraft({ ...draft, completion_xp: Number(e.target.value) })} className={inputClass} /></Field>
          </div>
          <Field label="Description"><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={4} className={`${inputClass} mt-2`} /></Field>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Journey Builder</p><h2 className="mt-2 text-3xl font-black text-slate-950">Map stops</h2><p className="mt-2 text-slate-600">{stops.length} stops · approximately {totalMinutes} minutes</p></div>
            <div className="flex gap-2"><select value={selectedDiscovery} onChange={(e) => setSelectedDiscovery(e.target.value)} className={inputClass}><option value="">Choose discovery</option>{discoveries.map((item) => <option key={item.discovery_id} value={item.discovery_id}>{item.passage} — {item.title}</option>)}</select><button type="button" onClick={addStop} className="rounded-xl bg-indigo-600 px-4 py-3 font-black text-white">Add</button></div>
          </div>

          <div className="mt-6 space-y-4">
            {stops.map((stop, index) => {
              const discovery = discoveries.find((item) => item.discovery_id === stop.discovery_id);
              return (
                <article key={stop.stop_key} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Stop {index + 1} · {stop.stop_type}</p><h3 className="mt-2 text-xl font-black text-slate-950">{discovery?.passage} — {discovery?.title}</h3></div>
                    <div className="flex gap-2"><button type="button" onClick={() => moveStop(index, -1)} disabled={index === 0} className={miniButton}>↑</button><button type="button" onClick={() => moveStop(index, 1)} disabled={index === stops.length - 1} className={miniButton}>↓</button><button type="button" onClick={() => setStops((current) => current.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, position: idx + 1 })))} className={miniButton}>Remove</button></div>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <Field label="Stop type"><select value={stop.stop_type} onChange={(e) => updateStop(index, { stop_type: e.target.value as Stop["stop_type"] })} className={inputClass}><option value="required">Required</option><option value="optional">Optional</option><option value="branch">Branch</option><option value="challenge">Challenge</option></select></Field>
                    <Field label="Branch label"><input value={stop.branch_label} onChange={(e) => updateStop(index, { branch_label: e.target.value })} className={inputClass} placeholder="Explore the Light theme" /></Field>
                    <Field label="Prerequisites"><select multiple value={stop.prerequisite_stop_keys} onChange={(e) => updateStop(index, { prerequisite_stop_keys: Array.from(e.target.selectedOptions).map((option) => option.value) })} className={`${inputClass} min-h-28`}>{stops.slice(0, index).map((item) => <option key={item.stop_key} value={item.stop_key}>Stop {item.position}</option>)}</select></Field>
                    <div className="space-y-4"><Field label="Transition prompt"><textarea value={stop.transition_prompt} onChange={(e) => updateStop(index, { transition_prompt: e.target.value })} rows={2} className={inputClass} /></Field><Field label="Reflection prompt"><textarea value={stop.reflection_prompt} onChange={(e) => updateStop(index, { reflection_prompt: e.target.value })} rows={2} className={inputClass} /></Field></div>
                  </div>
                </article>
              );
            })}
            {!stops.length && <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">Add reviewed discoveries to begin building the journey.</div>}
          </div>
        </section>

        <section className="sticky bottom-4 rounded-[2rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4"><p className="text-sm font-bold text-indigo-100">{message || `Current status: ${draft.status}`}</p><div className="flex gap-3"><button type="button" onClick={() => void saveMap()} disabled={saving} className="rounded-full border border-white/20 bg-white/10 px-5 py-3 font-black">{saving ? "Saving..." : "Save Draft"}</button><button type="button" onClick={() => void saveMap("published")} disabled={saving || stops.length === 0} className="rounded-full bg-amber-300 px-5 py-3 font-black text-slate-950">Publish Map</button></div></div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-black text-slate-700">{label}</span><div className="mt-2">{children}</div></label>;
}

const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
const miniButton = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40";
