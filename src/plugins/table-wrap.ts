import type { Root, Element, ElementContent } from "hast";
import { visit } from "unist-util-visit";

function isTableElement(node: Element): boolean {
  return node.tagName === "table";
}

function isAlreadyWrapped(parent: Element | Root): boolean {
  if (parent.type !== "element") return false;
  const className = (parent as Element).properties?.className;
  if (!Array.isArray(className)) return false;
  return className.map((c) => String(c)).includes("table-wrap");
}

export function rehypeTableWrap() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (!isTableElement(node) || !parent || index === undefined) return;
      if (isAlreadyWrapped(parent as Element | Root)) return;
      const wrapped: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-wrap"] },
        children: [node as ElementContent]
      };
      (parent.children as ElementContent[])[index] = wrapped;
    });
  };
}
