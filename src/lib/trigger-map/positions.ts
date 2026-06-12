import type { GraphModel, GraphNode, GraphEdge } from "./types";

// Offset applied when placing a new node near its already-positioned neighbour.
const NEIGHBOUR_OFFSET = { x: 40, y: 80 };

export function seedPositions(model: GraphModel): Map<string, { x: number; y: number }> {
  const store = new Map<string, { x: number; y: number }>();
  for (const node of model.nodes) {
    store.set(node.id, { x: node.position.x, y: node.position.y });
  }
  return store;
}

export function resolvePosition(
  store: Map<string, { x: number; y: number }>,
  node: GraphNode,
  edges: GraphEdge[],
): { x: number; y: number } {
  const stored = store.get(node.id);
  if (stored) return stored;

  // A new node should surface beside something it connects to, not stranded alone at the origin.
  for (const edge of edges) {
    if (edge.source === node.id || edge.target === node.id) {
      const neighbourId = edge.source === node.id ? edge.target : edge.source;
      const neighbourPos = store.get(neighbourId);
      if (neighbourPos) {
        return { x: neighbourPos.x + NEIGHBOUR_OFFSET.x, y: neighbourPos.y + NEIGHBOUR_OFFSET.y };
      }
    }
  }

  return { x: 0, y: 0 };
}
