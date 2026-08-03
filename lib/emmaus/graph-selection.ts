export type GraphPoint = { x: number; y: number };
export type GraphRect = { x: number; y: number; width: number; height: number };
export type GraphNodeBounds = GraphRect & { id: string };

export type SelectionMode = "replace" | "add" | "toggle";

export function selectNode(
  currentSelection: string[],
  nodeId: string,
  mode: SelectionMode = "replace",
): string[] {
  if (mode === "replace") return [nodeId];

  const selected = new Set(currentSelection);

  if (mode === "add") {
    selected.add(nodeId);
    return [...selected];
  }

  if (selected.has(nodeId)) selected.delete(nodeId);
  else selected.add(nodeId);

  return [...selected];
}

export function selectAll(nodeIds: string[]) {
  return [...new Set(nodeIds)];
}

export function clearSelection() {
  return [] as string[];
}

export function normalizeRect(start: GraphPoint, end: GraphPoint): GraphRect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function getNodesInsideRect(
  selectionRect: GraphRect,
  nodes: GraphNodeBounds[],
  containment: "intersect" | "fully-contained" = "intersect",
): string[] {
  return nodes
    .filter((node) => {
      if (containment === "fully-contained") {
        return (
          node.x >= selectionRect.x &&
          node.y >= selectionRect.y &&
          node.x + node.width <= selectionRect.x + selectionRect.width &&
          node.y + node.height <= selectionRect.y + selectionRect.height
        );
      }

      return rectanglesIntersect(selectionRect, node);
    })
    .map((node) => node.id);
}

export function mergeMarqueeSelection(
  currentSelection: string[],
  marqueeSelection: string[],
  mode: SelectionMode,
): string[] {
  if (mode === "replace") return selectAll(marqueeSelection);

  const selected = new Set(currentSelection);

  if (mode === "add") {
    for (const id of marqueeSelection) selected.add(id);
    return [...selected];
  }

  for (const id of marqueeSelection) {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
  }

  return [...selected];
}

export function getSelectionMode(modifiers: {
  shiftKey?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}): SelectionMode {
  if (modifiers.altKey) return "toggle";
  if (modifiers.shiftKey || modifiers.metaKey || modifiers.ctrlKey) return "add";
  return "replace";
}

export function getSelectionBounds(
  selectedIds: string[],
  nodeBounds: GraphNodeBounds[],
): GraphRect | null {
  const selected = nodeBounds.filter((node) => selectedIds.includes(node.id));
  if (!selected.length) return null;

  const left = Math.min(...selected.map((node) => node.x));
  const top = Math.min(...selected.map((node) => node.y));
  const right = Math.max(...selected.map((node) => node.x + node.width));
  const bottom = Math.max(...selected.map((node) => node.y + node.height));

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

export function translateSelection<T extends GraphPoint>(
  positions: Record<string, T>,
  selectedIds: string[],
  delta: GraphPoint,
  minimum: GraphPoint = { x: 0, y: 0 },
): Record<string, T> {
  const next = { ...positions };

  for (const id of selectedIds) {
    const position = positions[id];
    if (!position) continue;

    next[id] = {
      ...position,
      x: Math.max(minimum.x, position.x + delta.x),
      y: Math.max(minimum.y, position.y + delta.y),
    };
  }

  return next;
}

function rectanglesIntersect(a: GraphRect, b: GraphRect) {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}
