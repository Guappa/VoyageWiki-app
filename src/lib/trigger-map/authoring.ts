import type { NodeKind } from "./types";
import { asDict, asArray } from "../validator/helpers";

// known-entity splits into effect/condition and storage splits into four variants so callers never infer defaults
export type RelationChoice =
  | "quest-init"
  | "party-location"
  | "player-traits"
  | "known-entity-effect"
  | "known-entity-condition"
  | "read-boolean"
  | "read-number"
  | "write-boolean"
  | "write-number";

// single source of truth for the add direction; removeStructuredRef uses the inverse
interface ChoiceSpec {
  list: "conditions" | "effects";
  build: (targetKey: string) => Record<string, unknown>;
}

const CHOICE_SPECS: Record<RelationChoice, ChoiceSpec> = {
  "quest-init":            { list: "effects",    build: (k) => ({ type: "quest-init", value: k }) },
  "party-location":        { list: "conditions", build: (k) => ({ type: "party-location", operator: "equals", value: k }) },
  "player-traits":         { list: "conditions", build: (k) => ({ type: "player-traits", operator: "contains", value: k }) },
  "known-entity-effect":   { list: "effects",    build: (k) => ({ type: "known-entity", entity: k, operator: "set", value: true }) },
  "known-entity-condition":{ list: "conditions", build: (k) => ({ type: "known-entity", entity: k, operator: "equals", value: true }) },
  "read-boolean":          { list: "conditions", build: (k) => ({ type: "read-boolean", key: k, operator: "equals", value: true }) },
  "read-number":           { list: "conditions", build: (k) => ({ type: "read-number",  key: k, operator: "equals", value: 0 }) },
  "write-boolean":         { list: "effects",    build: (k) => ({ type: "write-boolean", key: k, operator: "set", value: true }) },
  "write-number":          { list: "effects",    build: (k) => ({ type: "write-number",  key: k, operator: "set", value: 0 }) },
};

// picker is shown only when length > 1; trigger returns [] (no authoring via graph drop)
const KIND_CHOICES: Record<NodeKind, RelationChoice[]> = {
  "quest":       ["quest-init"],
  "location":    ["party-location"],
  "trait":       ["player-traits"],
  "faction":     ["known-entity-effect", "known-entity-condition"],
  "npc":         ["known-entity-effect", "known-entity-condition"],
  "storage-key": ["read-boolean", "read-number", "write-boolean", "write-number"],
  "trigger":     [],
};

export function relationChoicesForKind(kind: NodeKind): RelationChoice[] {
  return KIND_CHOICES[kind] ?? [];
}

export function addStructuredRef(
  world: Record<string, unknown>,
  triggerName: string,
  choice: RelationChoice,
  targetKey: string,
): void {
  const triggers = asDict(world.triggers);
  if (!triggers[triggerName]) return;

  const trigger = asDict(triggers[triggerName]);
  const spec = CHOICE_SPECS[choice];
  const list = asArray(trigger[spec.list]);
  list.push(spec.build(targetKey));
  trigger[spec.list] = list;
}

type GraphRelation = "quest-init" | "quests-completed" | "party-location" | "player-traits" | "known-entity" | "reads" | "writes";

interface RemoveSpec {
  types: string[];
  field: "value" | "key" | "entity" | "questId";
  // known-entity must scan both lists; others are unambiguous
  lists: Array<"conditions" | "effects">;
}

const RELATION_REMOVE = {
  "quest-init":     { types: ["quest-init"],                   field: "value", lists: ["effects"] },
  "quests-completed": { types: ["quests-completed"],           field: "value", lists: ["conditions"] },
  "party-location": { types: ["party-location"],               field: "value", lists: ["conditions"] },
  "player-traits":  { types: ["player-traits"],                field: "value", lists: ["conditions"] },
  "known-entity":   { types: ["known-entity"],                 field: "entity", lists: ["conditions", "effects"] },
  "reads":          { types: ["read-boolean", "read-number", "read-string", "read-array"],   field: "key", lists: ["conditions"] },
  "writes":         { types: ["write-boolean", "write-number", "write-string", "write-array"], field: "key", lists: ["effects"] },
} satisfies Record<GraphRelation, RemoveSpec>;

// derived from RELATION_REMOVE so NodeInspector shares the same source of truth
export function typeToRelation(type: string): string | undefined {
  for (const [relation, spec] of Object.entries(RELATION_REMOVE)) {
    if ((spec as RemoveSpec).types.includes(type)) return relation;
  }
  return undefined;
}

function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Script gates reference triggers by name, so a rename must also rewrite `triggers['old']` refs or gates break.
export function renameTrigger(world: Record<string, unknown>, oldName: string, newName: string): boolean {
  const triggers = asDict(world.triggers);
  if (!triggers[oldName] || !newName || newName === oldName || triggers[newName]) return false;

  const rebuilt: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(triggers)) {
    if (key === oldName) {
      const entry = asDict(value);
      entry.name = newName;
      rebuilt[newName] = entry;
    } else {
      rebuilt[key] = value;
    }
  }
  world.triggers = rebuilt;

  const ref = new RegExp(`(triggers\\[\\s*)(['"])${escapeRegExp(oldName)}\\2(\\s*\\])`, "g");
  for (const value of Object.values(rebuilt)) {
    const trigger = asDict(value);
    if (typeof trigger.script === "string" && trigger.script.includes(oldName)) {
      trigger.script = trigger.script.replace(ref, (_m, pre, quote, post) => `${pre}${quote}${newName}${quote}${post}`);
    }
  }
  return true;
}

// Read-mutate-reassign mirrors addStructuredRef so it works whether asDict/asArray returned the live object or a copy.
export function updateStructuredEntry(
  world: Record<string, unknown>,
  triggerName: string,
  list: "conditions" | "effects",
  index: number,
  field: string,
  value: unknown,
): void {
  const triggers = asDict(world.triggers);
  if (!triggers[triggerName]) return;

  const trigger = asDict(triggers[triggerName]);
  const entries = asArray(trigger[list]);
  if (index < 0 || index >= entries.length) return;

  const item = asDict(entries[index]);
  item[field] = value;
  entries[index] = item;
  trigger[list] = entries;
}

export function setRecurring(world: Record<string, unknown>, triggerName: string, value: boolean): void {
  const triggers = asDict(world.triggers);
  if (!triggers[triggerName]) return;
  asDict(triggers[triggerName]).recurring = value;
}

export function appendEntry(
  world: Record<string, unknown>,
  triggerName: string,
  list: "conditions" | "effects",
  entry: Record<string, unknown>,
): void {
  const triggers = asDict(world.triggers);
  if (!triggers[triggerName]) return;

  const trigger = asDict(triggers[triggerName]);
  const entries = asArray(trigger[list]);
  entries.push(entry);
  trigger[list] = entries;
}

// Index-based removal so any entry is deletable, not only the connectable (relation-bearing) ones.
export function removeEntryAt(
  world: Record<string, unknown>,
  triggerName: string,
  list: "conditions" | "effects",
  index: number,
): void {
  const triggers = asDict(world.triggers);
  if (!triggers[triggerName]) return;

  const trigger = asDict(triggers[triggerName]);
  const entries = asArray(trigger[list]);
  if (index < 0 || index >= entries.length) return;

  entries.splice(index, 1);
  trigger[list] = entries;
}

// listOverride: inspector panel delete passes the exact list; graph edge delete omits it to scan all spec lists
export function removeStructuredRef(
  world: Record<string, unknown>,
  triggerName: string,
  relation: string,
  targetKey: string,
  listOverride?: "conditions" | "effects",
): void {
  const triggers = asDict(world.triggers);
  if (!triggers[triggerName]) return;

  const trigger = asDict(triggers[triggerName]);
  const spec = RELATION_REMOVE[relation as GraphRelation];
  if (!spec) return;

  const listsToScan = listOverride ? [listOverride] : spec.lists;

  for (const list of listsToScan) {
    const filtered = asArray(trigger[list]).filter((itemRaw) => {
      const item = asDict(itemRaw);
      const itemType = typeof item.type === "string" ? item.type : "";
      if (!spec.types.includes(itemType)) return true;
      const fieldValue = item[spec.field];
      return fieldValue !== targetKey;
    });
    trigger[list] = filtered;
  }
}
