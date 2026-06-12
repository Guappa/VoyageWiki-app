import dagre from "@dagrejs/dagre";
import type { TriggerGraph } from "./trigger-graph";

const NODE_W = 200;
const NODE_H = 64;

export function dependencyLayout(graph: TriggerGraph): Map<string, { x: number; y: number }> {
  const dagreGraph = new dagre.graphlib.Graph();
  // greedy acyclicer lets dagre rank a graph that still contains feedback loops (counters, mutual flags)
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 130, marginx: 40, marginy: 40, acyclicer: "greedy" });
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  for (const id of graph.triggerIds) dagreGraph.setNode(id, { width: NODE_W, height: NODE_H });
  for (const edge of graph.edges) dagreGraph.setEdge(edge.source, edge.target);

  dagre.layout(dagreGraph);

  const positions = new Map<string, { x: number; y: number }>();
  for (const id of graph.triggerIds) {
    const node = dagreGraph.node(id);
    positions.set(id, { x: node.x - NODE_W / 2, y: node.y - NODE_H / 2 });
  }
  return positions;
}
