export type CanvasPoint = { x: number; y: number };
export type CanvasSize = { width: number; height: number };
export type CanvasRect = CanvasPoint & CanvasSize;
export type CanvasTransform = {
  zoom: number;
  scrollLeft: number;
  scrollTop: number;
};

export type CanvasViewport = CanvasRect & {
  zoom: number;
};

export type CanvasBounds = CanvasRect;

export function clampZoom(
  zoom: number,
  minZoom = 0.5,
  maxZoom = 1.5,
  precision = 2,
) {
  const clamped = Math.min(maxZoom, Math.max(minZoom, zoom));
  const factor = 10 ** precision;
  return Math.round(clamped * factor) / factor;
}

export function screenToCanvas(
  point: CanvasPoint,
  viewportRect: CanvasRect,
  transform: CanvasTransform,
): CanvasPoint {
  return {
    x: (point.x - viewportRect.x + transform.scrollLeft) / transform.zoom,
    y: (point.y - viewportRect.y + transform.scrollTop) / transform.zoom,
  };
}

export function canvasToScreen(
  point: CanvasPoint,
  viewportRect: CanvasRect,
  transform: CanvasTransform,
): CanvasPoint {
  return {
    x: viewportRect.x + point.x * transform.zoom - transform.scrollLeft,
    y: viewportRect.y + point.y * transform.zoom - transform.scrollTop,
  };
}

export function getCanvasViewport(
  viewportSize: CanvasSize,
  transform: CanvasTransform,
): CanvasViewport {
  return {
    x: transform.scrollLeft / transform.zoom,
    y: transform.scrollTop / transform.zoom,
    width: viewportSize.width / transform.zoom,
    height: viewportSize.height / transform.zoom,
    zoom: transform.zoom,
  };
}

export function centerViewportOnPoint(
  point: CanvasPoint,
  viewportSize: CanvasSize,
  zoom: number,
): Pick<CanvasTransform, "scrollLeft" | "scrollTop"> {
  return {
    scrollLeft: Math.max(0, point.x * zoom - viewportSize.width / 2),
    scrollTop: Math.max(0, point.y * zoom - viewportSize.height / 2),
  };
}

export function zoomAroundPoint(
  current: CanvasTransform,
  anchorScreenPoint: CanvasPoint,
  viewportRect: CanvasRect,
  nextZoom: number,
  limits: { minZoom?: number; maxZoom?: number } = {},
): CanvasTransform {
  const zoom = clampZoom(nextZoom, limits.minZoom ?? 0.5, limits.maxZoom ?? 1.5);
  const anchorCanvasPoint = screenToCanvas(anchorScreenPoint, viewportRect, current);

  return {
    zoom,
    scrollLeft: Math.max(
      0,
      anchorCanvasPoint.x * zoom - (anchorScreenPoint.x - viewportRect.x),
    ),
    scrollTop: Math.max(
      0,
      anchorCanvasPoint.y * zoom - (anchorScreenPoint.y - viewportRect.y),
    ),
  };
}

export function panFromPointerDelta(
  start: Pick<CanvasTransform, "scrollLeft" | "scrollTop">,
  pointerDelta: CanvasPoint,
): Pick<CanvasTransform, "scrollLeft" | "scrollTop"> {
  return {
    scrollLeft: Math.max(0, start.scrollLeft - pointerDelta.x),
    scrollTop: Math.max(0, start.scrollTop - pointerDelta.y),
  };
}

export function getContentBounds(
  positions: Record<string, CanvasPoint>,
  nodeSize: CanvasSize,
  padding = 120,
  minimumSize: CanvasSize = { width: 1200, height: 760 },
): CanvasBounds {
  const points = Object.values(positions);
  if (!points.length) {
    return { x: 0, y: 0, width: minimumSize.width, height: minimumSize.height };
  }

  const left = Math.min(...points.map((point) => point.x));
  const top = Math.min(...points.map((point) => point.y));
  const right = Math.max(...points.map((point) => point.x + nodeSize.width));
  const bottom = Math.max(...points.map((point) => point.y + nodeSize.height));

  return {
    x: Math.min(0, left - padding),
    y: Math.min(0, top - padding),
    width: Math.max(minimumSize.width, right - Math.min(0, left - padding) + padding),
    height: Math.max(minimumSize.height, bottom - Math.min(0, top - padding) + padding),
  };
}

export function createMinimapTransform(
  contentBounds: CanvasBounds,
  minimapSize: CanvasSize,
  padding = 10,
) {
  const usableWidth = Math.max(1, minimapSize.width - padding * 2);
  const usableHeight = Math.max(1, minimapSize.height - padding * 2);
  const scale = Math.min(
    usableWidth / Math.max(1, contentBounds.width),
    usableHeight / Math.max(1, contentBounds.height),
  );

  return {
    scale,
    offsetX: padding - contentBounds.x * scale,
    offsetY: padding - contentBounds.y * scale,
  };
}

export function canvasPointToMinimap(
  point: CanvasPoint,
  minimapTransform: { scale: number; offsetX: number; offsetY: number },
): CanvasPoint {
  return {
    x: point.x * minimapTransform.scale + minimapTransform.offsetX,
    y: point.y * minimapTransform.scale + minimapTransform.offsetY,
  };
}

export function minimapPointToCanvas(
  point: CanvasPoint,
  minimapTransform: { scale: number; offsetX: number; offsetY: number },
): CanvasPoint {
  return {
    x: (point.x - minimapTransform.offsetX) / minimapTransform.scale,
    y: (point.y - minimapTransform.offsetY) / minimapTransform.scale,
  };
}

export function viewportToMinimapRect(
  viewport: CanvasViewport,
  minimapTransform: { scale: number; offsetX: number; offsetY: number },
): CanvasRect {
  const topLeft = canvasPointToMinimap(viewport, minimapTransform);
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: viewport.width * minimapTransform.scale,
    height: viewport.height * minimapTransform.scale,
  };
}

export function isPointInsideRect(point: CanvasPoint, rect: CanvasRect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}
