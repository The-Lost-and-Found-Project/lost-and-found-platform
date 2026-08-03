export type GraphLayoutNode = {
  id: string;
  node_type: string;
  title: string;
};

export type GraphLayoutEdge = {
  source_node_id: string;
  target_node_id: string;
};

export type GraphPosition = { x: number; y: number };
export type GraphLayoutMode = "grid" | "hierarchical" | "radial";
export type GraphLayoutOptions = {
  spacing?: number;
  gridSize?: number;
  originX?: number;
  originY?: number;
};

export function createGraphLayout(
  mode: GraphLayoutMode,
  nodes: GraphLayoutNode[],
  edges: GraphLayoutEdge[],
  options: GraphLayoutOptions = {},
): Record<string, GraphPosition> {
  const spacing = options.spacing ?? 1;
  const gridSize = options.gridSize ?? 24;
  const originX = options.originX ?? 72;
  const originY = options.originY ?? 72;

  if (!nodes.length) return {};

  if (mode === "radial") {
    return createRadialLayout(nodes, edges, spacing, gridSize, originX, originY);
  }

  if (mode === "hierarchical") {
    return createHierarchicalLayout(nodes, edges, spacing, gridSize, originX, originY);
  }

  return createGridLayout(nodes, spacing, gridSize, originX, originY);
}

export function getGraphDegreeMap(nodes: GraphLayoutNode[], edges: GraphLayoutEdge[]) {
  const degree = new Map(nodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    degree.set(edge.source_node_id, (degree.get(edge.source_node_id) ?? 0) + 1);
    degree.set(edge.target_node_id, (degree.get(edge.target_node_id) ?? 0) + 1);
  }
  return degree;
}

export function getOrphanNodeIds(nodes: GraphLayoutNode[], edges: GraphLayoutEdge[]) {
  const connected = new Set<string>();
  for (const edge of edges) {
    connected.add(edge.source_node_id);
    connected.add(edge.target_node_id);
  }
  return nodes.filter((node) => !connected.has(node.id)).map((node) => node.id);
}

function createGridLayout(
  nodes: GraphLayoutNode[],
  spacing: number,
  gridSize: number,
  originX: number,
  originY: number,
): Record<string, GraphPosition> {
  const sorted = [...nodes].sort(
    (a, b) => a.node_type.localeCompare(b.node_type) || a.title.localeCompare(b.title),
  );
  const columns = Math.max(3, Math.ceil(Math.sqrt(sorted.length)));
  const xGap = 280 * spacing;
  const yGap = 170 * spacing;

  return Object.fromEntries(
    sorted.map((node, index) => [
      node.id,
      snap(
        {
          x: originX + (index % columns) * xGap,
          y: originY + Math.floor(index / columns) * yGap,
        },
        gridSize,
      ),
    ]),
  );
}

function createHierarchicalLayout(
  nodes: GraphLayoutNode[],
  edges: GraphLayoutEdge[],
  spacing: number,
  gridSize: number,
  originX: number,
  originY: number,
): Record<string, GraphPosition> {
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]));

  for (const edge of edges) {
    incoming.set(edge.target_node_id, (incoming.get(edge.target_node_id) ?? 0) + 1);
    outgoing.get(edge.source_node_id)?.push(edge.target_node_id);
  }

  const roots = nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0);
  const queue = (roots.length ? roots : nodes.slice(0, 1)).map((node) => ({ id: node.id, level: 0 }));
  const levels = new Map<string, number>();

  while (queue.length) {
    const current = queue.shift()!;
    if (levels.has(current.id) && (levels.get(current.id) ?? 0) <= current.level) continue;
    levels.set(current.id, current.level);
    for (const target of outgoing.get(current.id) ?? []) {
      queue.push({ id: target, level: current.level + 1 });
    }
  }

  for (const node of nodes) {
    if (!levels.has(node.id)) levels.set(node.id, 0);
  }

  const grouped = new Map<number, GraphLayoutNode[]>();
  for (const node of nodes) {
    const level = levels.get(node.id) ?? 0;
    grouped.set(level, [...(grouped.get(level) ?? []), node]);
  }

  const positions: Record<string, GraphPosition> = {};
  const xGap = 290 * spacing;
  const yGap = 190 * spacing;

  for (const [level, levelNodes] of [...grouped.entries()].sort(([a], [b]) => a - b)) {
    const sorted = [...levelNodes].sort((a, b) => a.title.localeCompare(b.title));
    const totalWidth = Math.max(0, (sorted.length - 1) * xGap);
    sorted.forEach((node, index) => {
      positions[node.id] = snap(
        {
          x: originX + index * xGap - totalWidth / 2 + 600,
          y: originY + level * yGap,
        },
        gridSize,
      );
    });
  }

  return positions;
}

function createRadialLayout(
  nodes: GraphLayoutNode[],
  edges: GraphLayoutEdge[],
  spacing: number,
  gridSize: number,
  originX: number,
  originY: number,
): Record<string, GraphPosition> {
  const degree = getGraphDegreeMap(nodes, edges);
  const sorted = [...nodes].sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0));
  const center = sorted[0];
  const rest = sorted.slice(1);
  const centerX = originX + 578;
  const centerY = originY + 428;
  const positions: Record<string, GraphPosition> = {
    [center.id]: snap({ x: centerX, y: centerY }, gridSize),
  };

  let index = 0;
  let ring = 1;
  while (index < rest.length) {
    const count = Math.min(rest.length - index, Math.max(6, ring * 8));
    const radius = ring * 230 * spacing;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const node = rest[index + i];
      positions[node.id] = snap(
        {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        },
        gridSize,
      );
    }
    index += count;
    ring += 1;
  }

  return positions;
}

function snap(position: GraphPosition, gridSize: number): GraphPosition {
  return {
    x: Math.max(gridSize, Math.round(position.x / gridSize) * gridSize),
    y: Math.max(gridSize, Math.round(position.y / gridSize) * gridSize),
  };
}
