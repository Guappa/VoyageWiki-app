import { SCHEMA_TOP_LEVEL, type SchemaNode } from "~/lib/schema-root";

const MAX_DEPTH = 8;

function isNode(value: unknown): value is SchemaNode {
  return typeof value === "object" && value !== null;
}

// Turn a schema node into an example-shaped value (field -> type), the JSON shown in each section's auto Schema block.
export function schemaToShape(node: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return "...";
  if (typeof node === "string") return node === "Int" || node === "Float" ? "number" : node;
  if (!isNode(node)) return node;
  switch (node._type) {
    case "intersection": {
      const merged: Record<string, unknown> = {};
      for (const part of (node.parts as unknown[]) ?? []) {
        const shaped = schemaToShape(part, depth + 1);
        if (isNode(shaped)) Object.assign(merged, shaped);
      }
      return merged;
    }
    case "required":
    case "partial": {
      const fields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries((node.fields as Record<string, unknown>) ?? {})) {
        fields[key] = schemaToShape(value, depth + 1);
      }
      return fields;
    }
    case "record":
      return { "<key>": schemaToShape(node.codomain, depth + 1) };
    case "array":
      return [schemaToShape(node.of, depth + 1)];
    case "union": {
      const options = (node.of as unknown[]) ?? [];
      const literals = options.filter((option): option is SchemaNode => isNode(option) && option._type === "literal");
      if (literals.length > 0 && literals.length === options.length) {
        return literals.map((option) => String(option.value)).join(" | ");
      }
      const concrete = options.filter((option) => !(isNode(option) && option._type === "undefined"));
      return concrete.length > 0 ? schemaToShape(concrete[0], depth + 1) : "any";
    }
    case "literal":
      return node.value;
    default:
      return node._type ?? "any";
  }
}

// The example-shape JSON for one top-level section, wrapped under its key, or null if the section is not in the schema.
export function sectionShapeJson(section: string): string | null {
  const entry = SCHEMA_TOP_LEVEL[section];
  if (!entry) return null;
  return JSON.stringify({ [section]: schemaToShape(entry.schema) }, null, 2);
}
