import type { Issue, ValidationContext } from "./types";

export function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asDict(value: unknown): Record<string, unknown> {
  return isObj(value) ? value : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function typeName(value: unknown): string {
  if (value === null) return "NoneType";
  if (Array.isArray(value)) return "list";
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "float";
  if (typeof value === "string") return "str";
  if (typeof value === "object") return "dict";
  return typeof value;
}

// Quote and truncate a value for readable error messages.
export function repr(value: unknown): string {
  if (typeof value === "string") return "'" + value + "'";
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  return JSON.stringify(value);
}

export function describe(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return "boolean (" + value + ")";
  if (typeof value === "number") return "number (" + value + ")";
  if (typeof value === "string") {
    const truncated = value.length > 40 ? value.slice(0, 40) : value;
    return "string (" + repr(truncated) + ")";
  }
  if (Array.isArray(value)) return "array (len=" + value.length + ")";
  if (isObj(value)) return "object (keys=" + JSON.stringify(Object.keys(value).slice(0, 4)) + ")";
  return typeof value;
}

export function prettyJsonLen(obj: unknown): number {
  try { return JSON.stringify(obj, null, 2).length; } catch { return 0; }
}

export function compactJsonLen(obj: unknown): number {
  try { return JSON.stringify(obj).length; } catch { return 0; }
}

// Raw .length to match the engine's per-field counter; JSON-encoded length only applies to per-entry and per-section caps.
export function jsonEncodedLength(value: string): number {
  return value.length;
}

export function withThousands(n: number): string {
  return n.toLocaleString("en-US");
}

// Shared formatter for the `a`, `b`, `c` enum lists in "change it to one of ..." fixes.
export function quotedList(values: Iterable<string>, sort = false): string {
  const list = [...values];
  if (sort) list.sort();
  return list.map((value) => "`" + value + "`").join(", ");
}

// NFC normalize + lowercase + trim. Engine matches resource keys this way.
export function normalizeText(value: unknown): string {
  return String(value ?? "").normalize("NFC").toLowerCase().trim();
}

export interface IssueParts {
  title: string;
  fix?: string;
  detail?: string;
  value?: string;
  docsAnchor?: string;
}

// Accepts structured parts, or a legacy "title — detail — fix: action" string split once into its fields.
function toParts(input: IssueParts | string): IssueParts {
  if (typeof input !== "string") return input;
  let problem = input;
  let fix: string | undefined;
  // The fix marker is our own suffix, so split on the last one — an author value earlier in the string can't hijack it.
  const fixMarker = input.lastIndexOf(" — fix: ");
  if (fixMarker !== -1) {
    problem = input.slice(0, fixMarker);
    fix = input.slice(fixMarker + " — fix: ".length).trim();
  }
  const sep = problem.indexOf(" — ");
  if (sep !== -1) {
    return { title: problem.slice(0, sep).trim(), detail: problem.slice(sep + 3).trim(), fix };
  }
  return { title: problem.trim(), fix };
}

function pushIssue(list: Issue[], severity: Issue["severity"], path: string, input: IssueParts | string): void {
  const parts = toParts(input);
  const issue: Issue = { path, severity, title: parts.title, fix: parts.fix ?? "" };
  if (parts.detail) issue.detail = parts.detail;
  if (parts.value) issue.value = parts.value;
  if (parts.docsAnchor) issue.docsAnchor = parts.docsAnchor;
  list.push(issue);
}

export function addError(context: ValidationContext, path: string, input: IssueParts | string): void {
  pushIssue(context.errors, "error", path, input);
}
export function addWarning(context: ValidationContext, path: string, input: IssueParts | string): void {
  pushIssue(context.warnings, "warning", path, input);
}
export function addRecommendation(context: ValidationContext, path: string, input: IssueParts | string): void {
  pushIssue(context.recommendations, "recommendation", path, input);
}

export function refError(
  context: ValidationContext,
  value: string,
  collection: Record<string, unknown> | Set<string>,
  path: string,
  label: string,
): void {
  if (!value) return;
  const has = collection instanceof Set ? collection.has(value) : value in collection;
  if (has) return;
  addError(context, path, {
    title: "unknown " + label,
    value,
    fix: "add it as a new " + label + " entry, or change this reference to an existing " + label + " key",
  });
}

// Voyage's UI char counter uses JSON-encoded string length. Match it.
export function strLimit(
  context: ValidationContext,
  value: unknown,
  path: string,
  limit: number,
): void {
  if (typeof value !== "string") return;
  const encoded = jsonEncodedLength(value);
  if (encoded > limit) {
    addError(context, path, {
      title: "exceeds the " + withThousands(limit) + "-char limit (" + withThousands(encoded) + " chars)",
      fix: "trim " + withThousands(encoded - limit) + " chars",
    });
  }
}

export function sectionSize(
  context: ValidationContext,
  obj: unknown,
  key: string,
  limit: number,
): void {
  const size = prettyJsonLen(obj);
  if (size > limit) {
    addError(context, key, {
      title: "section is " + withThousands(size) + " chars, over the " + withThousands(limit) + "-char limit (pretty JSON)",
      fix: "trim " + withThousands(size - limit) + " chars by removing or shortening entries",
      detail: "measure with `len(json.dumps(world[" + repr(key) + "], indent=2))`",
    });
  }
}

export function warnEmpty(
  context: ValidationContext,
  path: string,
  value: unknown,
  message: string,
): void {
  if (!((value ?? "") as string).trim()) addWarning(context, path, message);
}
