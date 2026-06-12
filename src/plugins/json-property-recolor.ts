import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";

export function rehypeJsonPropertyRecolor() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "pre") return;
      // Mark the pre itself with a debug class so we can see if the plugin runs
      node.properties = node.properties ?? {};
      const classes = Array.isArray(node.properties.className) ? node.properties.className.map(String) : [];
      classes.push("DEBUG-RECOLOR-VISITED");
      // Also dump child count and first child type
      const childCount = node.children.length;
      const firstChildType = node.children[0]?.type ?? "none";
      classes.push("DEBUG-CHILDREN-" + childCount);
      classes.push("DEBUG-FIRSTCHILD-" + firstChildType);
      if (node.children[0] && node.children[0].type === "element") {
        classes.push("DEBUG-FIRSTCHILDTAG-" + (node.children[0] as Element).tagName);
      }
      node.properties.className = classes;
    });
  };
}
