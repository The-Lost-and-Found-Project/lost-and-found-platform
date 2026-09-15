export default function Loading() {
  return (
    <main className="lfp-page" aria-busy="true" aria-live="polite">
      <div className="lfp-shell py-10 sm:py-14">
        <div className="animate-pulse space-y-5">
          <div className="h-3 w-28 rounded-full bg-slate-200" />
          <div className="h-10 w-full max-w-lg rounded-2xl bg-slate-200" />
          <div className="h-5 w-full max-w-2xl rounded-xl bg-slate-100" />
          <div className="grid gap-4 pt-4 sm:grid-cols-2">
            <div className="h-40 rounded-[2rem] bg-slate-100" />
            <div className="h-40 rounded-[2rem] bg-slate-100" />
          </div>
        </div>
        <p className="sr-only">Loading The Lost and Found Project</p>
      </div>
    </main>
  );
}
