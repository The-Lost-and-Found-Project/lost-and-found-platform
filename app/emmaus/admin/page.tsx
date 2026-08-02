import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EmmausAdminPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect('/login');
 return (<main className="mx-auto max-w-5xl p-8"><h1 className="text-4xl font-bold">Emmaus Discovery Builder</h1><p className="mt-4">Founder-only workspace.</p><div className="mt-8 grid gap-4 md:grid-cols-2"><section className="rounded-xl border p-4"><h2 className="font-semibold">New Discovery</h2><ul className="list-disc ml-5 mt-2"><li>Title</li><li>Passage</li><li>Prompts</li><li>Threads</li></ul></section><section className="rounded-xl border p-4"><h2 className="font-semibold">Coming Next</h2><ul className="list-disc ml-5 mt-2"><li>Visual thread editor</li><li>Preview</li><li>Publish</li></ul></section></div></main>)}