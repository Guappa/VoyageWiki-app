import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";

function isExternal(href: string | undefined): boolean {
  if (!href) return false;
  if (href.startsWith("http://") || href.startsWith("https://")) return true;
  if (href.startsWith("//")) return true;
  return false;
}

export function rehypeExternalLinksBlank() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const props = node.properties ?? {};
      const href = props.href as string | undefined;
      if (!isExternal(href)) return;
      props.target = "_blank";
      const rel = typeof props.rel === "string" ? props.rel : Array.isArray(props.rel) ? (props.rel as string[]).join(" ") : "";
      const relSet = new Set(rel.split(/\s+/).filter(Boolean));
      relSet.add("noopener");
      relSet.add("noreferrer");
      props.rel = Array.from(relSet).join(" ");
      node.properties = props;
    });
  };
}
