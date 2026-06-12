import { describe, it, expect } from "vitest";
import dagre from "@dagrejs/dagre";
import { layout } from "./layout";
import type { GraphModel } from "./types";

// Dimensions must match layout.ts constants so expected values stay in sync.
const NODE_W = 180;
const NODE_H = 56;

const g: GraphModel = {
  nodes: [
    { id: "trigger:a", kind: "trigger", key: "a", label: "a", position: { x: 0, y: 0 } },
    { id: "quest:q", kind: "quest", key: "q", label: "q", position: { x: 0, y: 0 } },
  ],
  edges: [{ id: "e", source: "trigger:a", target: "quest:q", relation: "quest-init", origin: "structured" }],
};

describe("layout", () => {
  it("assigns distinct positions to every node", () => {
    const out = layout(g);
    const a = out.nodes.find((n) => n.id === "trigger:a")!;
    const q = out.nodes.find((n) => n.id === "quest:q")!;
    expect(a.position).not.toEqual({ x: 0, y: 0 });
    expect(a.position).not.toEqual(q.position);
  });

  it("converts dagre centre coordinates to top-left origin for a single-node graph", () => {
    // fails if the half-dimension subtraction is removed from layout()
    const dg = new dagre.graphlib.Graph();
    dg.setGraph({ rankdir: "TB", nodesep: 70, ranksep: 120, marginx: 40, marginy: 40 });
    dg.setDefaultEdgeLabel(() => ({}));
    dg.setNode("solo:n", { width: NODE_W, height: NODE_H });
    dagre.layout(dg);
    const centre = dg.node("solo:n");

    const single: GraphModel = {
      nodes: [{ id: "solo:n", kind: "trigger", key: "n", label: "n", position: { x: 0, y: 0 } }],
      edges: [],
    };
    const out = layout(single);
    const node = out.nodes.find((n) => n.id === "solo:n")!;

    expect(node.position.x).toBe(centre.x - NODE_W / 2);
    expect(node.position.y).toBe(centre.y - NODE_H / 2);
  });
});
