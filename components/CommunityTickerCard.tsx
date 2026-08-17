type Props = {
  label: string;
  content: string;
  icon: string;
  meta?: React.ReactNode;
  onOpen: () => void;
};

export default function CommunityTickerCard({ label, content, icon, meta, onOpen }: Props) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-28 w-full items-start gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
        aria-label={`Open full ${label}`}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl ring-1 ring-indigo-100" aria-hidden="true">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-base leading-7 text-slate-800">{content}</span>
          <span className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
            <span>{meta}</span>
            <span className="text-indigo-700">Read full {label} →</span>
          </span>
        </span>
      </button>
    </article>
  );
}
