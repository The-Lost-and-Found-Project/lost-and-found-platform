import {
  canRedo,
  canUndo,
  commitHistory,
  createHistoryState,
  isHistoryDirty,
  markHistorySaved,
  redoHistory,
  replacePresent,
  resetHistory,
  undoHistory,
  type HistoryState,
} from "@/lib/emmaus/graph-history";
import {
  clearSelection,
  selectAll,
  selectNode,
  type SelectionMode,
} from "@/lib/emmaus/graph-selection";
import {
  clampZoom,
  type CanvasTransform,
  type CanvasPoint,
} from "@/lib/emmaus/graph-canvas";

export type GraphStoreNode = {
  id: string;
  node_key: string;
  node_type: string;
  title: string;
  subtitle?: string | null;
  scripture_reference?: string | null;
  summary?: string | null;
  status: "draft" | "reviewed" | "published" | "archived";
  metadata?: Record<string, unknown> | null;
};

export type GraphStoreEdge = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_key: string;
  explanation?: string | null;
  confidence_score: number;
  confidence_class: string;
  evidence_summary?: string | null;
  interpretive_notes?: string | null;
  status: "draft" | "reviewed" | "published" | "archived";
};

export type GraphStorePositions = Record<string, CanvasPoint>;

export type GraphDocument = {
  nodes: GraphStoreNode[];
  edges: GraphStoreEdge[];
  positions: GraphStorePositions;
};

export type GraphSelectionState = {
  nodeIds: string[];
  edgeId: string | null;
};

export type GraphViewportState = CanvasTransform;

export type GraphStoreState = {
  documentHistory: HistoryState<GraphDocument>;
  selection: GraphSelectionState;
  viewport: GraphViewportState;
  status: "idle" | "loading" | "saving" | "error";
  message: string;
  error: string | null;
  revision: number;
};

export type GraphStoreListener = (state: GraphStoreState) => void;

export type GraphStore = ReturnType<typeof createGraphStore>;

export function createGraphStore(
  initialDocument: GraphDocument = { nodes: [], edges: [], positions: {} },
  options: { historyLimit?: number; zoom?: number } = {},
) {
  let state: GraphStoreState = {
    documentHistory: createHistoryState(initialDocument, options.historyLimit ?? 50),
    selection: { nodeIds: [], edgeId: null },
    viewport: { zoom: options.zoom ?? 1, scrollLeft: 0, scrollTop: 0 },
    status: "idle",
    message: "",
    error: null,
    revision: 0,
  };

  const listeners = new Set<GraphStoreListener>();

  function getState() {
    return state;
  }

  function subscribe(listener: GraphStoreListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function emit() {
    for (const listener of listeners) listener(state);
  }

  function setState(updater: (current: GraphStoreState) => GraphStoreState) {
    state = updater(state);
    emit();
  }

  function loadDocument(document: GraphDocument) {
    setState((current) => ({
      ...current,
      documentHistory: resetHistory(current.documentHistory, document),
      selection: { nodeIds: [], edgeId: null },
      status: "idle",
      message: "Graph loaded.",
      error: null,
      revision: current.revision + 1,
    }));
  }

  function replaceDocument(document: GraphDocument) {
    setState((current) => ({
      ...current,
      documentHistory: replacePresent(current.documentHistory, document),
      revision: current.revision + 1,
    }));
  }

  function commitDocument(
    label: string,
    nextDocument: GraphDocument,
    metadata?: Record<string, unknown>,
  ) {
    setState((current) => ({
      ...current,
      documentHistory: commitHistory(current.documentHistory, {
        label,
        before: current.documentHistory.present,
        after: nextDocument,
        metadata,
      }),
      status: "idle",
      message: label,
      error: null,
      revision: current.revision + 1,
    }));
  }

  function updateDocument(
    label: string,
    updater: (document: GraphDocument) => GraphDocument,
    metadata?: Record<string, unknown>,
  ) {
    const current = state.documentHistory.present;
    commitDocument(label, updater(cloneDocument(current)), metadata);
  }

  function addNode(node: GraphStoreNode, position: CanvasPoint) {
    updateDocument("Create node", (document) => ({
      ...document,
      nodes: [...document.nodes, node],
      positions: { ...document.positions, [node.id]: { ...position } },
    }), { nodeId: node.id });
  }

  function updateNode(nodeId: string, patch: Partial<GraphStoreNode>) {
    updateDocument("Update node", (document) => ({
      ...document,
      nodes: document.nodes.map((node) =>
        node.id === nodeId ? { ...node, ...patch } : node,
      ),
    }), { nodeId });
  }

  function removeNodes(nodeIds: string[]) {
    const ids = new Set(nodeIds);
    updateDocument(
      `Delete ${ids.size} ${ids.size === 1 ? "node" : "nodes"}`,
      (document) => ({
        nodes: document.nodes.filter((node) => !ids.has(node.id)),
        edges: document.edges.filter(
          (edge) => !ids.has(edge.source_node_id) && !ids.has(edge.target_node_id),
        ),
        positions: Object.fromEntries(
          Object.entries(document.positions).filter(([id]) => !ids.has(id)),
        ),
      }),
      { nodeIds: [...ids] },
    );
    clearGraphSelection();
  }

  function addEdge(edge: GraphStoreEdge) {
    updateDocument("Create relationship", (document) => ({
      ...document,
      edges: [...document.edges, edge],
    }), { edgeId: edge.id });
  }

  function updateEdge(edgeId: string, patch: Partial<GraphStoreEdge>) {
    updateDocument("Update relationship", (document) => ({
      ...document,
      edges: document.edges.map((edge) =>
        edge.id === edgeId ? { ...edge, ...patch } : edge,
      ),
    }), { edgeId });
  }

  function removeEdge(edgeId: string) {
    updateDocument("Delete relationship", (document) => ({
      ...document,
      edges: document.edges.filter((edge) => edge.id !== edgeId),
    }), { edgeId });
    clearGraphSelection();
  }

  function setPositions(
    positions: GraphStorePositions,
    label = "Move nodes",
    metadata?: Record<string, unknown>,
  ) {
    updateDocument(label, (document) => ({
      ...document,
      positions: {
        ...document.positions,
        ...Object.fromEntries(
          Object.entries(positions).map(([id, point]) => [id, { ...point }]),
        ),
      },
    }), metadata);
  }

  function selectGraphNode(nodeId: string, mode: SelectionMode = "replace") {
    setState((current) => ({
      ...current,
      selection: {
        nodeIds: selectNode(current.selection.nodeIds, nodeId, mode),
        edgeId: null,
      },
    }));
  }

  function selectGraphNodes(nodeIds: string[]) {
    setState((current) => ({
      ...current,
      selection: { nodeIds: selectAll(nodeIds), edgeId: null },
    }));
  }

  function selectGraphEdge(edgeId: string) {
    setState((current) => ({
      ...current,
      selection: { nodeIds: [], edgeId },
    }));
  }

  function clearGraphSelection() {
    setState((current) => ({
      ...current,
      selection: { nodeIds: clearSelection(), edgeId: null },
    }));
  }

  function setViewport(patch: Partial<GraphViewportState>) {
    setState((current) => ({
      ...current,
      viewport: {
        ...current.viewport,
        ...patch,
        zoom:
          patch.zoom === undefined
            ? current.viewport.zoom
            : clampZoom(patch.zoom),
      },
    }));
  }

  function setStatus(
    status: GraphStoreState["status"],
    message = "",
    error: string | null = null,
  ) {
    setState((current) => ({ ...current, status, message, error }));
  }

  function undo() {
    if (!canUndo(state.documentHistory)) return;
    setState((current) => ({
      ...current,
      documentHistory: undoHistory(current.documentHistory),
      selection: { nodeIds: [], edgeId: null },
      message: "Undo complete.",
      revision: current.revision + 1,
    }));
  }

  function redo() {
    if (!canRedo(state.documentHistory)) return;
    setState((current) => ({
      ...current,
      documentHistory: redoHistory(current.documentHistory),
      selection: { nodeIds: [], edgeId: null },
      message: "Redo complete.",
      revision: current.revision + 1,
    }));
  }

  function markSaved() {
    setState((current) => ({
      ...current,
      documentHistory: markHistorySaved(current.documentHistory),
      status: "idle",
      message: "All changes saved.",
      error: null,
    }));
  }

  function getDocument() {
    return state.documentHistory.present;
  }

  function isDirty() {
    return isHistoryDirty(state.documentHistory);
  }

  return {
    getState,
    getDocument,
    subscribe,
    loadDocument,
    replaceDocument,
    commitDocument,
    updateDocument,
    addNode,
    updateNode,
    removeNodes,
    addEdge,
    updateEdge,
    removeEdge,
    setPositions,
    selectGraphNode,
    selectGraphNodes,
    selectGraphEdge,
    clearGraphSelection,
    setViewport,
    setStatus,
    undo,
    redo,
    markSaved,
    isDirty,
  };
}

function cloneDocument(document: GraphDocument): GraphDocument {
  if (typeof structuredClone === "function") return structuredClone(document);
  return JSON.parse(JSON.stringify(document)) as GraphDocument;
}
