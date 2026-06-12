import type { Root, Code } from "mdast";
import { visit } from "unist-util-visit";

const TREAT_AS_JSON_LANG = new Set(["", "text", "txt", "plaintext", "plain"]);

function looksLikeJson(value: string): boolean {
  const trimmed = (value ?? "").trim();
  if (trimmed.length === 0) return false;
  const first = trimmed[0];
  if (first === "{") return true;
  if (first === '"') return true;
  if (first === "[") {
    const after = trimmed.slice(1).trimStart();
    if (after.length === 0) return true;
    const next = after[0];
    if (next === '"' || next === "{" || next === "[" || next === "]") return true;
    if (next === "-" || next === "+" || (next >= "0" && next <= "9")) return true;
    if (after.startsWith("true") || after.startsWith("false") || after.startsWith("null")) return true;
    return false;
  }
  return false;
}

export function remarkRetagCodeAsJson() {
  return (tree: Root) => {
    visit(tree, "code", (node: Code) => {
      const lang = (node.lang ?? "").toLowerCase();
      if (!TREAT_AS_JSON_LANG.has(lang)) return;
      if (!looksLikeJson(node.value)) return;
      node.lang = "json";
    });
  };
}
