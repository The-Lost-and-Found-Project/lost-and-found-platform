"use client";

import { useEffect } from "react";
import type { GraphStore } from "@/lib/emmaus/graph-store";
import {
  useGraphHistoryStatus,
  useGraphStoreState,
  useGraphViewport,
} from "@/lib/emmaus/use-graph-store";

export default function FounderGraphStoreToolbar({
  store,
  selectedCount,
  onConnect,
  onAutoLayout,
  snapToGrid,
  onToggleSnap,
}: {
  store: GraphStore;
  selectedCount: number;
  onConnect: () => void;
  onAutoLayout: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
}) {
  const state = useGraphStoreState(store);
  const viewport = useGraphViewport(store);
  const history = useGraphHistoryStatus(store);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT") return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        store.redo();
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "0") {
        event.preventDefault();
        store.setViewport({ zoom: 1 });
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "+") {
        event.preventDefault();
        store.setViewport({ zoom: viewport.zoom + 0.1 });
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "-") {
        event.preventDefault();
        store.setViewport({ zoom: viewport.zoom - 0.1 });
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [store, viewport.zoom]);

  return (
    <div className="space-y-3 border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Visual Graph Builder</p>
          <p className="mt-1 text-sm text-indigo-100/70">
            {state.documentHistory.present.nodes.length} nodes · {selectedCount} selected · {history.dirty ? "unsaved changes" : "saved"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!history.canUndo}
            title={history.undoLabel ? `Undo ${history.undoLabel}` : "Nothing to undo"}
            onClick={() => store.undo()}
            className={toolButton}
          >
            Undo
          </button>
          <button
            type="button"
            disabled={!history.canRedo}
            title={history.redoLabel ? `Redo ${history.redoLabel}` : "Nothing to redo"}
            onClick={() => store.redo()}
            className={toolButton}
          >
            Redo
          </button>
          <button
            type="button"
            onClick={onToggleSnap}
            className={`rounded-full px-4 py-2 text-sm font-black ${snapToGrid ? "bg-emerald-300 text-slate-950" : "border border-white/20 bg-white/10"}`}
          >
            Snap {snapToGrid ? "on" : "off"}
          </button>
          <button
            type="button"
            disabled={selectedCount !== 1}
            onClick={onConnect}
            className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-40"
          >
            Connect
          </button>
          <button type="button" onClick={onAutoLayout} className={toolButton}>
            Auto-layout
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-h-5 text-xs font-bold text-indigo-100/60" aria-live="polite">
          {state.error ?? state.message}
        </p>

        <div className="flex items-center rounded-xl border border-white/15 bg-white/10">
          <button type="button" onClick={() => store.setViewport({ zoom: viewport.zoom - 0.1 })} className="px-3 py-2 font-black">−</button>
          <button type="button" onClick={() => store.setViewport({ zoom: 1 })} className="min-w-16 px-2 py-2 text-center text-xs font-black">{Math.round(viewport.zoom * 100)}%</button>
          <button type="button" onClick={() => store.setViewport({ zoom: viewport.zoom + 0.1 })} className="px-3 py-2 font-black">+</button>
        </div>
      </div>
    </div>
  );
}

const toolButton = "rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black disabled:opacity-35";
