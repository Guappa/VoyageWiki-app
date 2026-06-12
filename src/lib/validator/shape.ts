import { describe, isObj, typeName } from "./helpers";
import type { Issue, ValidationContext } from "./types";

// Editor strips on export but accepts missing on import; `embeddings` is required and must be present (use `{}`).
const ENGINE_MANAGED_TOP_LEVEL = new Set(["embeddingDimension", "embeddingModel"]);

interface SchemaNode {
  _type?: string;
  fields?: Record<string, unknown>;
  parts?: unknown[];
  of?: unknown[];
  value?: unknown;
  codomain?: unknown;
  element?: unknown;
  domain?: unknown;
}

function isSchemaNode(value: unknown): value is SchemaNode {
  return typeof value === "object" && value !== null;
}

function shapeError(errors: Issue[], path: string, title: string, fix: string): void {
  errors.push({ path, severity: "error", title, fix });
}

function primitiveMatches(value: unknown, typeName: string): boolean {
  if (typeName === "string")    return typeof value === "string";
  if (typeName === "number")    return typeof value === "number" && !Number.isNaN(value);
  if (typeName === "boolean")   return typeof value === "boolean";
  if (typeName === "Int")       return Number.isInteger(value) && typeof value === "number";
  if (typeName === "null")      return value === null;
  if (typeName === "undefined") return value === null || value === undefined;
  return false;
}

function checkPrimitive(value: unknown, type: string, path: string, errors: Issue[]): void {
  if (type === "Int") {
    if (!(Number.isInteger(value) && typeof value === "number")) {
      shapeError(errors, path, "expected an integer, got " + describe(value), "change it to a whole number");
    }
    return;
  }
  if (!primitiveMatches(value, type)) {
    shapeError(errors, path, "expected `" + type + "`, got " + describe(value), "change it to a " + type + " value");
  }
}

function validateInner(value: unknown, schema: unknown, path: string, errors: Issue[]): void {
  if (schema === null || schema === undefined) return;

  if (typeof schema === "string") {
    if (schema !== "(recursive)") checkPrimitive(value, schema, path, errors);
    return;
  }

  if (!isSchemaNode(schema)) return;
  const nodeType = schema._type;

  if (nodeType === "required" || nodeType === "partial") {
    if (!isObj(value)) {
      shapeError(errors, path, "expected an object, got " + typeName(value), "change it to an object");
      return;
    }
    const fields = (schema.fields ?? {}) as Record<string, unknown>;
    for (const [field, fieldSchema] of Object.entries(fields)) {
      const childPath = path ? path + "." + field : field;
      if (!(field in value)) {
        if (nodeType === "required" && !(path === "" && ENGINE_MANAGED_TOP_LEVEL.has(field))) {
          shapeError(errors, childPath, "required field missing", "add a `" + field + "` key with the expected type");
        }
      } else {
        validateInner((value as Record<string, unknown>)[field], fieldSchema, childPath, errors);
      }
    }
    return;
  }

  if (nodeType === "intersection") {
    for (const part of schema.parts ?? []) {
      if (typeof part !== "string") validateInner(value, part, path, errors);
    }
    return;
  }

  if (nodeType === "union") {
    const branches = schema.of ?? [];
    for (const branch of branches) {
      if (typeof branch === "string") {
        if (branch === "undefined" || (branch === "null" && value === null)) return;
        if (primitiveMatches(value, branch)) return;
        continue;
      }
      const branchErrors: Issue[] = [];
      validateInner(value, branch, path, branchErrors);
      if (branchErrors.length === 0) return;
    }
    const typeNames: string[] = [];
    for (const branch of branches.slice(0, 6)) {
      if (typeof branch === "string") {
        typeNames.push(branch);
      } else if (isSchemaNode(branch) && branch._type === "literal") {
        typeNames.push(JSON.stringify(branch.value));
      } else if (isSchemaNode(branch) && branch._type === "required") {
        const keys = Object.keys((branch.fields ?? {}) as Record<string, unknown>);
        typeNames.push("{ " + keys.slice(0, 3).join(", ") + " }");
      } else if (isSchemaNode(branch)) {
        typeNames.push(branch._type ?? "?");
      }
    }
    shapeError(errors, path, "expected one of " + typeNames.join(" | ") + ", got " + describe(value), "change it to match one of those shapes");
    return;
  }

  if (nodeType === "array") {
    if (!Array.isArray(value)) {
      shapeError(errors, path, "expected an array, got " + typeName(value), "change it to an array");
      return;
    }
    value.forEach((item, i) => validateInner(item, schema.of, path + "[" + i + "]", errors));
    return;
  }

  if (nodeType === "record") {
    if (!isObj(value)) {
      shapeError(errors, path, "expected an object, got " + typeName(value), "change it to an object");
      return;
    }
    for (const [key, entryValue] of Object.entries(value)) {
      validateInner(entryValue, schema.codomain, path ? path + "." + key : key, errors);
    }
    return;
  }

  if (nodeType === "literal") {
    if (value !== schema.value) {
      shapeError(errors, path, "expected " + JSON.stringify(schema.value) + ", got " + JSON.stringify(value), "change it to " + JSON.stringify(schema.value));
    }
    return;
  }
}

export function validateShape(world: unknown, schema: unknown, context: ValidationContext): void {
  const localErrors: Issue[] = [];
  validateInner(world, schema, "", localErrors);
  context.errors.push(...localErrors);
}
