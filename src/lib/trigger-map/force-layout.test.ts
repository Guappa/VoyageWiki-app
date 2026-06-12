import { describe, it, expect } from "vitest";
import { forceLayout, separateOverlaps, NODE_W, NODE_H, MARGIN } from "./force-layout";
import type { GraphModel } from "./types";
import type { MutablePos } from "./force-layout";

const model: GraphModel = {
  nodes: [
    { id: "trigger:t1", kind: "trigger", key: "t1", label: "T1", position: { x: 0, y: 0 } },
    { id: "trigger:t2", kind: "trigger", key: "t2", label: "T2", position: { x: 0, y: 0 } },
    { id: "trigger:t3", kind: "trigger", key: "t3", label: "T3", position: { x: 0, y: 0 } },
    { id: "quest:q1", kind: "quest", key: "q1", label: "Q1", position: { x: 0, y: 0 } },
    { id: "quest:q2", kind: "quest", key: "q2", label: "Q2", position: { x: 0, y: 0 } },
    { id: "quest:q3", kind: "quest", key: "q3", label: "Q3", position: { x: 0, y: 0 } },
  ],
  edges: [
    { id: "e1", source: "trigger:t1", target: "quest:q1", relation: "quest-init", origin: "structured" },
    { id: "e2", source: "trigger:t2", target: "quest:q2", relation: "quest-init", origin: "structured" },
    { id: "e3", source: "trigger:t3", target: "quest:q3", relation: "quest-init", origin: "structured" },
  ],
};

describe("forceLayout", () => {
  it("gives every node a finite, non-NaN position", () => {
    const out = forceLayout(model);
    for (const node of out.nodes) {
      expect(Number.isFinite(node.position.x)).toBe(true);
      expect(Number.isFinite(node.position.y)).toBe(true);
    }
  });

  it("spreads nodes so the bounding box is non-degenerate", () => {
    const out = forceLayout(model);
    const xs = out.nodes.map((n) => n.position.x);
    const ys = out.nodes.map((n) => n.position.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  it("produces identical positions on repeated calls (deterministic)", () => {
    const first = forceLayout(model);
    const second = forceLayout(model);
    for (let i = 0; i < first.nodes.length; i++) {
      expect(first.nodes[i].position).toEqual(second.nodes[i].position);
    }
  });

  it("does not mutate the input model's node positions", () => {
    const original = model.nodes.map((n) => ({ ...n.position }));
    forceLayout(model);
    for (let i = 0; i < model.nodes.length; i++) {
      expect(model.nodes[i].position).toEqual(original[i]);
    }
  });

  it("produces no overlapping node boxes after layout (separation on at least one axis >= box extent + margin)", () => {
    // Dense starting model: all nodes at the origin — worst case for the de-overlap pass.
    const denseModel: GraphModel = {
      nodes: Array.from({ length: 12 }, (_, i) => ({
        id: `trigger:n${i}`,
        kind: "trigger" as const,
        key: `n${i}`,
        label: `N${i}`,
        position: { x: 0, y: 0 },
      })),
      edges: [],
    };

    const out = forceLayout(denseModel);
    const minGapX = NODE_W + MARGIN;
    const minGapY = NODE_H + MARGIN;

    for (let i = 0; i < out.nodes.length; i++) {
      for (let j = i + 1; j < out.nodes.length; j++) {
        const a = out.nodes[i].position;
        const b = out.nodes[j].position;
        const clearX = Math.abs(b.x - a.x) >= minGapX;
        const clearY = Math.abs(b.y - a.y) >= minGapY;
        expect(clearX || clearY, `nodes ${i} and ${j} overlap: a=(${a.x},${a.y}) b=(${b.x},${b.y})`).toBe(true);
      }
    }
  });

  it("separateOverlaps resolves a directly-stacked pair", () => {
    // Two nodes at the same centre — maximum overlap on both axes.
    const positions: MutablePos[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
    separateOverlaps(positions);
    const minGapX = NODE_W + MARGIN;
    const minGapY = NODE_H + MARGIN;
    const clearX = Math.abs(positions[1].x - positions[0].x) >= minGapX;
    const clearY = Math.abs(positions[1].y - positions[0].y) >= minGapY;
    expect(clearX || clearY).toBe(true);
  });

  it("separateOverlaps is deterministic (identical output on two calls)", () => {
    const makePositions = (): MutablePos[] =>
      Array.from({ length: 8 }, (_, i) => ({ x: i * 10, y: i * 5 }));

    const a = makePositions();
    const b = makePositions();
    separateOverlaps(a);
    separateOverlaps(b);

    for (let i = 0; i < a.length; i++) {
      expect(a[i].x).toBe(b[i].x);
      expect(a[i].y).toBe(b[i].y);
    }
  });
});
