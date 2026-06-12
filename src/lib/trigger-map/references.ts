import type { GraphModel, EdgeOrigin } from "./types";
import { nodeId } from "./types";

export interface TriggerReference {
  trigger: string;
  relation: string;
  origin: EdgeOrigin;
  triggerNodeId: string;
}

// Edges always originate at a trigger node; the source id is `trigger:<name>`.
export function findReferencingTriggers(model: GraphModel, targetNodeId: string): TriggerReference[] {
  const triggerPrefix = nodeId("trigger", "");
  return model.edges
    .filter((e) => e.target === targetNodeId && e.source.startsWith(triggerPrefix))
    .map((e) => ({ trigger: e.source.slice(triggerPrefix.length), relation: e.relation, origin: e.origin, triggerNodeId: e.source }));
}
