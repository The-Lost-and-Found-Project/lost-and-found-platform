"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  createGraphStore,
  type GraphDocument,
  type GraphStore,
  type GraphStoreState,
} from "@/lib/emmaus/graph-store";

export function useCreateGraphStore(
  initialDocument: GraphDocument = { nodes: [], edges: [], positions: {} },
  options: { historyLimit?: number; zoom?: number } = {},
) {
  return useMemo(
    () => createGraphStore(initialDocument, options),
    [],
  );
}

export function useGraphStoreState(store: GraphStore): GraphStoreState {
  return useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  );
}

export function useGraphDocument(store: GraphStore) {
  const state = useGraphStoreState(store);
  return state.documentHistory.present;
}

export function useGraphSelection(store: GraphStore) {
  return useGraphStoreState(store).selection;
}

export function useGraphViewport(store: GraphStore) {
  return useGraphStoreState(store).viewport;
}

export function useGraphHistoryStatus(store: GraphStore) {
  const state = useGraphStoreState(store);
  return {
    canUndo: state.documentHistory.past.length > 0,
    canRedo: state.documentHistory.future.length > 0,
    undoLabel: state.documentHistory.past.at(-1)?.label ?? null,
    redoLabel: state.documentHistory.future[0]?.label ?? null,
    dirty: store.isDirty(),
  };
}
