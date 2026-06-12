import type { NodeKind } from "./types";

// Operator vocabularies from the wiki triggers reference (mechanics/triggers.md).
const STRING_OPS = ["equals", "notEquals", "contains", "notContains", "regex"];
const NUMERIC_OPS = ["equals", "notEquals", "greaterThan", "lessThan", "greaterThanOrEqual", "lessThanOrEqual"];
const MEMBERSHIP_OPS = ["contains", "notContains"];
const BOOL_READ_OPS = ["equals", "notEquals"];
const WRITE_NUMBER_OPS = ["set", "add", "subtract", "multiply", "divide"];
const ARRAY_WRITE_OPS = ["set", "add", "remove", "clear"];

export type ValueEditor =
  | { control: "bool" }
  | { control: "number" }
  | { control: "text" }
  | { control: "json" }
  | { control: "ref"; node: NodeKind }
  | { control: "none" };

export interface NamedField {
  field: string;
  // combo offers existing-node suggestions while still accepting a free-typed name
  control: "text" | "ref" | "combo";
  node?: NodeKind;
  nodes?: NodeKind[];
}

export interface EntryFieldSpec {
  keyField: NamedField | null;
  // null distinguishes "no operator field" (story/action/quest-progress) from an empty list
  operators: string[] | null;
  value: ValueEditor;
  prose: "query" | "instruction" | null;
}

const NONE: ValueEditor = { control: "none" };
const STORAGE_KEY: NamedField = { field: "key", control: "text" };
const RESOURCE: NamedField = { field: "resource", control: "text" };
const ENTITY: NamedField = { field: "entity", control: "combo", nodes: ["npc", "faction", "location"] };

// Keyed by `${list}:${type}` because party-location / player-traits take different operators per direction.
const SPECS: Record<string, EntryFieldSpec> = {
  "conditions:read-boolean":     { keyField: STORAGE_KEY, operators: BOOL_READ_OPS,  value: { control: "bool" },                 prose: null },
  "conditions:read-number":      { keyField: STORAGE_KEY, operators: NUMERIC_OPS,     value: { control: "number" },               prose: null },
  "conditions:read-string":      { keyField: STORAGE_KEY, operators: STRING_OPS,      value: { control: "text" },                 prose: null },
  "conditions:read-array":       { keyField: STORAGE_KEY, operators: MEMBERSHIP_OPS,  value: { control: "json" },                 prose: null },
  "conditions:game-tick":        { keyField: null,        operators: NUMERIC_OPS,     value: { control: "number" },               prose: null },
  "conditions:player-level":     { keyField: null,        operators: NUMERIC_OPS,     value: { control: "number" },               prose: null },
  "conditions:player-resource":  { keyField: RESOURCE,    operators: NUMERIC_OPS,     value: { control: "number" },               prose: null },
  "conditions:party-location":   { keyField: null,        operators: STRING_OPS,      value: { control: "ref", node: "location" }, prose: null },
  "conditions:party-area":       { keyField: null,        operators: STRING_OPS,      value: { control: "text" },                 prose: null },
  "conditions:party-region":     { keyField: null,        operators: STRING_OPS,      value: { control: "text" },                 prose: null },
  "conditions:party-realm":      { keyField: null,        operators: STRING_OPS,      value: { control: "text" },                 prose: null },
  "conditions:story-text":       { keyField: null,        operators: STRING_OPS,      value: { control: "text" },                 prose: null },
  "conditions:action-text":      { keyField: null,        operators: STRING_OPS,      value: { control: "text" },                 prose: null },
  "conditions:player-traits":    { keyField: null,        operators: MEMBERSHIP_OPS,  value: { control: "ref", node: "trait" },   prose: null },
  "conditions:quests-completed": { keyField: null,        operators: MEMBERSHIP_OPS,  value: { control: "ref", node: "quest" },   prose: null },
  "conditions:known-entity":     { keyField: ENTITY,      operators: BOOL_READ_OPS,   value: { control: "bool" },                 prose: null },
  "conditions:story":            { keyField: null,        operators: null,            value: NONE,                                prose: "query" },
  "conditions:action":           { keyField: null,        operators: null,            value: NONE,                                prose: "query" },

  "effects:write-boolean":       { keyField: STORAGE_KEY, operators: ["set"],          value: { control: "bool" },                 prose: null },
  "effects:write-number":        { keyField: STORAGE_KEY, operators: WRITE_NUMBER_OPS, value: { control: "number" },               prose: null },
  "effects:write-string":        { keyField: STORAGE_KEY, operators: ["set"],          value: { control: "text" },                 prose: null },
  "effects:write-array":         { keyField: STORAGE_KEY, operators: ARRAY_WRITE_OPS,  value: { control: "json" },                 prose: null },
  "effects:quest-init":          { keyField: null,        operators: ["set"],          value: { control: "ref", node: "quest" },   prose: null },
  "effects:quest-progress":      { keyField: { field: "questId", control: "ref", node: "quest" }, operators: null, value: NONE,   prose: null },
  "effects:party-location":      { keyField: null,        operators: ["set"],          value: { control: "ref", node: "location" }, prose: null },
  "effects:party-area":          { keyField: null,        operators: ["set"],          value: { control: "text" },                 prose: null },
  "effects:party-region":        { keyField: null,        operators: ["set"],          value: { control: "text" },                 prose: null },
  "effects:party-realm":         { keyField: null,        operators: ["set"],          value: { control: "text" },                 prose: null },
  "effects:player-traits":       { keyField: null,        operators: ["add", "remove", "set"], value: { control: "ref", node: "trait" }, prose: null },
  "effects:player-resource":     { keyField: RESOURCE,    operators: WRITE_NUMBER_OPS, value: { control: "number" },               prose: null },
  "effects:known-entity":        { keyField: ENTITY,      operators: ["set", "toggle"], value: { control: "bool" },                prose: null },
  "effects:story":               { keyField: null,        operators: null,            value: NONE,                                prose: "instruction" },
};

export function entryFieldSpec(list: "conditions" | "effects", type: string): EntryFieldSpec | null {
  return SPECS[`${list}:${type}`] ?? null;
}

export function entryTypesFor(list: "conditions" | "effects"): string[] {
  const prefix = `${list}:`;
  return Object.keys(SPECS).filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
}

// Seeds a new entry with its key/operator/value fields so the row renders immediately and is then edited inline.
export function buildDefaultEntry(list: "conditions" | "effects", type: string): Record<string, unknown> {
  const entry: Record<string, unknown> = { type };
  const spec = SPECS[`${list}:${type}`];
  if (!spec) return entry;
  if (spec.keyField) entry[spec.keyField.field] = "";
  if (spec.operators?.length) entry.operator = spec.operators[0];
  if (spec.prose) entry[spec.prose] = "";
  if (spec.value.control === "bool") entry.value = true;
  else if (spec.value.control === "number") entry.value = 0;
  else if (spec.value.control === "json") entry.value = [];
  else if (spec.value.control === "text" || spec.value.control === "ref") entry.value = "";
  return entry;
}
