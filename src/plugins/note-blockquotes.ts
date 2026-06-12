import type { Root, Element, ElementContent, Text } from "hast";
import { visit } from "unist-util-visit";

const NOTE_VARIANTS: Array<[string, string]> = [
  ["📋", "note"],
  ["✅", "confirmed"],
  ["🤖", "narrator"],
  ["🧠", "inferred"],
  ["🤔", "confusing"],
  ["🐛", "issue"],
  ["⚠️", "warning"],
  ["⚠", "warning"],
  ["🔧", "dev"],
  ["ℹ️", "info"],
  ["ℹ", "info"],
  ["🔄", "update"]
];

function isElement(node: ElementContent): node is Element {
  return node.type === "element";
}

function findFirstChildElement(parent: Element, tagName: string): Element | undefined {
  return parent.children.find((child): child is Element => isElement(child) && child.tagName === tagName);
}

function findFirstTextChild(parent: Element): Text | undefined {
  return parent.children.find((child): child is Text => child.type === "text");
}

function detectNoteEmoji(strongText: string): [string, string] | null {
  for (const [emoji, variant] of NOTE_VARIANTS) {
    if (strongText.startsWith(emoji)) return [emoji, variant];
  }
  return null;
}

function classNamesOf(node: Element): string[] {
  const raw = node.properties?.className;
  if (!Array.isArray(raw)) return [];
  return raw.map(String);
}

function transformBlockquote(node: Element): boolean {
  const firstP = findFirstChildElement(node, "p");
  if (!firstP) return false;

  const firstStrong = findFirstChildElement(firstP, "strong");
  if (!firstStrong) return false;

  const firstTextChild = findFirstTextChild(firstStrong);
  if (!firstTextChild) return false;

  const detection = detectNoteEmoji(firstTextChild.value);
  if (!detection) return false;

  const [emoji, variant] = detection;

  firstTextChild.value = firstTextChild.value.slice(emoji.length).replace(/^\s+/, "");

  const iconNode: Element = {
    type: "element",
    tagName: "span",
    properties: { className: ["note-block__icon"], "aria-hidden": "true" },
    children: [{ type: "text", value: emoji }]
  };

  const bodyNode: Element = {
    type: "element",
    tagName: "div",
    properties: { className: ["note-block__body"] },
    children: node.children
  };

  node.children = [iconNode, bodyNode];
  node.properties = node.properties ?? {};
  const existing = classNamesOf(node);
  node.properties.className = [...existing, "note-block", `note-block--${variant}`];
  return true;
}

export function rehypeNoteBlockquotes() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "blockquote") return;
      if (classNamesOf(node).includes("note-block")) return;
      transformBlockquote(node);
    });
  };
}
