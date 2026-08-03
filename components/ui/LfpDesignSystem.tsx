import Link from "next/link";

export function LfpEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="lfp-eyebrow">{children}</p>;
}

export function LfpPrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="lfp-button lfp-button-primary">{children}</Link>;
}

export function LfpSecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="lfp-button lfp-button-secondary">{children}</Link>;
}

export function LfpFeatureCard({
  eyebrow,
  title,
  description,
  href,
  action,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
  icon: string;
}) {
  return (
    <Link href={href} className="lfp-card group block p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl ring-1 ring-indigo-100" aria-hidden="true">{icon}</span>
        <span className="text-sm font-bold text-indigo-700 transition group-hover:translate-x-1">{action} →</span>
      </div>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-indigo-600">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h3>
      <p className="mt-3 leading-7 text-slate-600">{description}</p>
    </Link>
  );
}

export function LfpComingSoonCard({
  title,
  description,
  icon,
  planned,
}: {
  title: string;
  description: string;
  icon: string;
  planned: string[];
}) {
  return (
    <article className="lfp-card relative overflow-hidden p-6 sm:p-7">
      <div aria-hidden="true" className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-200/35 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl ring-1 ring-amber-100" aria-hidden="true">{icon}</span>
          <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-amber-300">Coming Soon</span>
        </div>
        <h3 className="mt-6 text-2xl font-black tracking-tight text-slate-950">{title}</h3>
        <p className="mt-3 leading-7 text-slate-600">{description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {planned.map((item) => <span key={item} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{item}</span>)}
        </div>
      </div>
    </article>
  );
}

export function LfpSectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="max-w-3xl">
      <LfpEyebrow>{eyebrow}</LfpEyebrow>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-lg leading-8 text-slate-600">{description}</p>}
    </div>
  );
}
