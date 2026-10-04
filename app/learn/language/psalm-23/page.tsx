import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import LanguageLessonClient from "@/components/learning-lab/LanguageLessonClient";
import {psalmTwentyThreeLesson} from "@/lib/learning-lab/language/psalm-23";
export default async function Psalm23LanguageLessonPage(){
 const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next=%2Flearn%2Flanguage%2Fpsalm-23");
 return <main className="lfp-page pb-24"><div className="lfp-shell py-8 sm:py-12"><div className="mb-6 flex flex-wrap gap-3"><Link href="/learn/language" className="lfp-button lfp-button-secondary">← Language Insights</Link><Link href="/auth/emmaus?next=/study" className="lfp-button lfp-button-secondary">Investigate in Emmaus</Link></div><LanguageLessonClient lesson={psalmTwentyThreeLesson}/></div></main>
}