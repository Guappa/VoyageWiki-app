export type NodeKind =
  | "trigger" | "quest" | "npc" | "location" | "faction" | "trait" | "storage-key";

// "structured" edges round-trip to JSON; "script" edges are parsed from script text (read-only).
export type EdgeOrigin = "structured" | "script";

export interface GraphNode {
  id: string;
  kind: NodeKind;
  key: string;
  label: string;
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  origin: EdgeOrigin;
}

export interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const nodeId = (kind: NodeKind, key: string): string => `${kind}:${key}`;

export const isTriggerId = (id: string): boolean => id.startsWith("trigger:");

export const triggerKeyFromId = (id: string): string => id.slice("trigger:".length);
