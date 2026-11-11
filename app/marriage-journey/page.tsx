import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const sessions = [
  ["Listening Is an Act of Love", "James 1:19-20; Proverbs 18:13"],
  ["Why Do We React So Strongly?", "Proverbs 4:23; Psalm 139:23-24"],
  ["Speaking Truth Without Causing Harm", "Ephesians 4:15,25-32"],
  ["When Conflict Becomes a Battle", "Proverbs 15:1; Romans 12:18"],
  ["Intentions and Impact", "Philippians 2:3-4; 1 Corinthians 13:4-7"],
  ["Understanding Your Spouse's Needs", "Romans 12:10; 1 Peter 3:7"],
  ["Our Communication Covenant", "Colossians 3:12-15"],
  ["Becoming One Flesh", "Genesis 2:18-25; Matthew 19:4-6"],
  ["God's Calling and Family Responsibilities", "Ephesians 5:25-33; Mark 7:9-13"],
  ["Leadership That Looks Like Jesus", "Mark 10:42-45; John 13:1-17"],
  ["Expectations We Never Discussed", "Philippians 2:3-4; Proverbs 20:5"],
  ["Recovery and Healthy Boundaries", "Galatians 6:2-5; Luke 5:15-16"],
  ["Becoming a Family", "Deuteronomy 6:4-9; Ephesians 6:4"],
  ["Protecting Our Marriage in a New Season", "Ecclesiastes 3:1-8"],
  ["Your Past and Your Future", "Psalm 34:18; Romans 12:2"],
  ["Forgiveness and Rebuilding Trust", "Ephesians 4:31-32; Luke 17:3-4"],
  ["When Ministry Becomes Our Identity", "Luke 10:38-42; John 15:4-5"],
  ["Creating Emotional Safety", "Romans 12:9-10; Colossians 3:12-14"],
  ["Praying as Husband and Wife", "Philippians 4:6-7; 1 Peter 3:7"],
  ["Weathering Difficult Seasons", "Matthew 7:24-27; Ecclesiastes 4:9-12"],
  ["Choosing Each Other, Choosing Christ", "Joshua 24:15; Colossians 3:12-17"],
] as const;

export default async function MarriageJourneyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/marriage-journey");
  return <main className="lfp-page pb-24">
    <section className="bg-slate-950 text-white"><div className="lfp-shell py-14 sm:py-20">
      <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">The Lost & Found Project · Marriage Discipleship</p>
      <h1 className="mt-3 text-4xl font-black sm:text-6xl">One Flesh, One Foundation</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">A Christ-centered, 21-session journey through communication, expectations, family, ministry, and healing. Progress at your own pace.</p>
      <p className="mt-5 text-sm text-amber-200">Your private reflections are yours. Do not enter sensitive information until private journaling and sharing controls are available.</p>
    </div></section>
    <div className="lfp-shell py-10 space-y-10">{[0,1,2].map(week => <section key={week}>
      <h2 className="text-2xl font-black text-slate-900">Week {week+1} · {['Learning to Hear and Understand','Marriage, Ministry, and Expectations','Healing, Trust, and Lasting Habits'][week]}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{sessions.slice(week*7,week*7+7).map(([title,scripture],index)=><article key={title} className="lfp-card p-6">
        <p className="text-xs font-black uppercase tracking-widest text-indigo-700">Session {week*7+index+1}</p>
        <h3 className="mt-2 text-xl font-black">{title}</h3><p className="mt-2 text-sm text-slate-600">Read: {scripture}</p>
        <p className="mt-4 text-sm text-slate-600">Read the passage together. Consider what it teaches about Christlike love, your own responsibility, and one practical action you can take today.</p>
        <p className="mt-3 text-xs text-slate-500">Full teaching, reflection forms, and saved progress are being prepared for this module.</p>
      </article>)}</div>
    </section>)}
      <p className="text-sm text-slate-600">This discipleship journey does not replace professional trauma-informed counseling or emergency support.</p>
      <Link href="/studies" className="font-bold text-indigo-700">Return to Bible Studies</Link>
    </div>
  </main>;
}
