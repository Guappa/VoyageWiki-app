import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import type { GraphModel, GraphNode } from "./types";

// Golden angle in radians — irrational step prevents clumping on a spiral seed.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const SEED_RADIUS = 200;

// Physical dimensions of every node box in the rendered canvas.
const NODE_W = 200;
const NODE_H = 64;
// Minimum clear gap between any two boxes on both axes.
const MARGIN = 40;

// Hard cap so a dense pile can't loop forever; early-exit ends it as soon as a pass moves nothing.
const MAX_PASSES = 300;

// Link length and repulsion grow with node degree so hubs fan neighbours out instead of knotting up.
const LINK_BASE = 80;
const LINK_PER_DEGREE = 15;
const CHARGE_BASE = -420;
const CHARGE_PER_DEGREE = 55;
const DEGREE_CAP = 14;
// Pre-spread radius is wider than a node's half-height so the sim spaces boxes before de-overlap runs.
const COLLIDE_RADIUS = 82;
// Weak centring keeps the graph near the origin without pulling clusters back into each other.
const CENTER_STRENGTH = 0.02;
const TICKS = 500;

interface SimNode extends SimulationNodeDatum {
  id: string;
}

type SimLink = SimulationLinkDatum<SimNode> & { source: string | SimNode; target: string | SimNode; distance: number };

interface MutablePos {
  x: number;
  y: number;
}

// Spatial-grid cell size matches the minimum clear distance so neighbors span at most one extra cell.
const CELL_W = NODE_W + MARGIN;
const CELL_H = NODE_H + MARGIN;

function cellKey(x: number, y: number): string {
  return `${Math.floor(x / CELL_W)},${Math.floor(y / CELL_H)}`;
}

// Grid-bucketed so overlap resolution stays near-linear, not O(n²).
function separateOverlaps(positions: MutablePos[]): void {
  // Two equal boxes clear each other only when centres are a full box extent + margin apart.
  const minGapX = NODE_W + MARGIN;
  const minGapY = NODE_H + MARGIN;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    // Rebuild grid every pass because positions change.
    const grid = new Map<string, number[]>();
    for (let i = 0; i < positions.length; i++) {
      const key = cellKey(positions[i].x, positions[i].y);
      const bucket = grid.get(key);
      if (bucket) bucket.push(i);
      else grid.set(key, [i]);
    }

    let moved = false;

    for (let i = 0; i < positions.length; i++) {
      const pi = positions[i];
      const ci = Math.floor(pi.x / CELL_W);
      const ri = Math.floor(pi.y / CELL_H);

      // Test against nodes in the 3×3 neighbourhood to catch all possible overlapping pairs.
      for (let dc = -1; dc <= 1; dc++) {
        for (let dr = -1; dr <= 1; dr++) {
          const neighbours = grid.get(`${ci + dc},${ri + dr}`);
          if (!neighbours) continue;

          for (const j of neighbours) {
            // Canonical ordering so each pair is pushed once per pass.
            if (j <= i) continue;

            const pj = positions[j];
            const dx = pj.x - pi.x;
            const dy = pj.y - pi.y;
            const overlapX = minGapX - Math.abs(dx);
            const overlapY = minGapY - Math.abs(dy);

            // Boxes are clear when separated on at least one axis — no correction needed.
            if (overlapX <= 0 || overlapY <= 0) continue;

            // Push along the axis of smallest penetration to minimise total displacement.
            if (overlapX < overlapY) {
              const push = overlapX / 2;
              const sign = dx >= 0 ? 1 : -1;
              pi.x -= sign * push;
              pj.x += sign * push;
            } else {
              const push = overlapY / 2;
              const sign = dy >= 0 ? 1 : -1;
              pi.y -= sign * push;
              pj.y += sign * push;
            }
            moved = true;
          }
        }
      }
    }

    if (!moved) break;
  }
}

function buildSeedNodes(graphNodes: GraphNode[]): SimNode[] {
  return graphNodes.map((node, i) => ({
    id: node.id,
    x: SEED_RADIUS * Math.cos(i * GOLDEN_ANGLE),
    y: SEED_RADIUS * Math.sin(i * GOLDEN_ANGLE),
  }));
}

export function forceLayout(model: GraphModel): GraphModel {
  const simNodes = buildSeedNodes(model.nodes);

  const degree = new Map<string, number>();
  for (const e of model.edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  const deg = (id: string): number => degree.get(id) ?? 0;

  const simLinks: SimLink[] = model.edges.map((e) => ({
    source: e.source,
    target: e.target,
    distance: LINK_BASE + LINK_PER_DEGREE * Math.sqrt(deg(e.source) + deg(e.target)),
  }));

  const sim = forceSimulation<SimNode>(simNodes)
    .force("link", forceLink<SimNode, SimLink>(simLinks).id((d) => d.id).distance((l) => l.distance).strength(0.5))
    .force("charge", forceManyBody<SimNode>().strength((d) => CHARGE_BASE - CHARGE_PER_DEGREE * Math.min(deg(d.id), DEGREE_CAP)))
    .force("collide", forceCollide<SimNode>(COLLIDE_RADIUS))
    .force("x", forceX<SimNode>(0).strength(CENTER_STRENGTH))
    .force("y", forceY<SimNode>(0).strength(CENTER_STRENGTH))
    .stop();

  for (let i = 0; i < TICKS; i++) sim.tick();

  // separateOverlaps works on floating-point centres; round only after de-overlap is complete.
  const mutablePositions: MutablePos[] = simNodes.map((n) => ({ x: n.x ?? 0, y: n.y ?? 0 }));
  separateOverlaps(mutablePositions);

  const posById = new Map(
    simNodes.map((n, i) => [
      n.id,
      { x: Math.round(mutablePositions[i].x), y: Math.round(mutablePositions[i].y) },
    ])
  );

  const nodes: GraphNode[] = model.nodes.map((node) => ({
    ...node,
    position: posById.get(node.id) ?? { x: 0, y: 0 },
  }));

  return { nodes, edges: model.edges };
}

// Exported for tests — callers should use forceLayout.
export { separateOverlaps, NODE_W, NODE_H, MARGIN };
export type { MutablePos };
