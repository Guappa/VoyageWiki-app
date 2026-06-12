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
import { separateOverlaps } from "./force-layout";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const SEED_RADIUS = 200;

// Triggers are held above, everything they touch settles below, so all edges read top-to-bottom.
const TRIGGER_BAND_Y = -260;
const ENTITY_BAND_Y = 260;
const BAND_STRENGTH = 0.32;

const CHARGE = -380;
const LINK_DISTANCE = 110;
const LINK_STRENGTH = 0.22;
const COLLIDE_RADIUS = 82;
const CENTER_STRENGTH = 0.02;
const TICKS = 500;

interface SimNode extends SimulationNodeDatum {
  id: string;
  isTrigger: boolean;
}

type SimLink = SimulationLinkDatum<SimNode> & { source: string | SimNode; target: string | SimNode };

export function layeredLayout(model: GraphModel): GraphModel {
  const simNodes: SimNode[] = model.nodes.map((node, i) => ({
    id: node.id,
    isTrigger: node.kind === "trigger",
    x: SEED_RADIUS * Math.cos(i * GOLDEN_ANGLE),
    y: (node.kind === "trigger" ? TRIGGER_BAND_Y : ENTITY_BAND_Y) + SEED_RADIUS * Math.sin(i * GOLDEN_ANGLE),
  }));

  const simLinks: SimLink[] = model.edges.map((e) => ({ source: e.source, target: e.target }));

  const sim = forceSimulation<SimNode>(simNodes)
    .force("link", forceLink<SimNode, SimLink>(simLinks).id((d) => d.id).distance(LINK_DISTANCE).strength(LINK_STRENGTH))
    .force("charge", forceManyBody<SimNode>().strength(CHARGE))
    .force("y", forceY<SimNode>((d) => (d.isTrigger ? TRIGGER_BAND_Y : ENTITY_BAND_Y)).strength(BAND_STRENGTH))
    .force("x", forceX<SimNode>(0).strength(CENTER_STRENGTH))
    .force("collide", forceCollide<SimNode>(COLLIDE_RADIUS))
    .stop();

  for (let i = 0; i < TICKS; i++) sim.tick();

  const mutablePositions = simNodes.map((n) => ({ x: n.x ?? 0, y: n.y ?? 0 }));
  separateOverlaps(mutablePositions);

  const posById = new Map(
    simNodes.map((n, i) => [n.id, { x: Math.round(mutablePositions[i].x), y: Math.round(mutablePositions[i].y) }]),
  );

  const nodes: GraphNode[] = model.nodes.map((node) => ({
    ...node,
    position: posById.get(node.id) ?? { x: 0, y: 0 },
  }));

  return { nodes, edges: model.edges };
}
