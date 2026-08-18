"use client";

import { useEffect, useRef } from "react";

type Props = {
  eyebrow: string;
  title: string;
  content: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  onClose: () => void;
};

export default function CommunityDetailDialog({
  eyebrow,
  title,
  content,
  meta,
  actions,
  onClose,
}: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeButtonRef.current?.click();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-detail-title"
        className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{eyebrow}</p>
            <h2 id="community-detail-title" className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{title}</h2>
            {meta ? <div className="mt-2 text-sm text-slate-500">{meta}</div> : null}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close full view"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-700 transition hover:bg-slate-200"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          <p className="whitespace-pre-wrap text-lg leading-8 text-slate-800">{content}</p>
        </div>

        {actions ? <div className="border-t border-slate-100 px-5 py-4 sm:px-7">{actions}</div> : null}
      </section>
    </div>
  );
}
