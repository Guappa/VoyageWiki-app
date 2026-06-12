// Skips: <code> inside <pre>, <code> already inside <a>, and inexact field-name matches.
import type { Root, Element } from "hast";
import fieldTips from "../data/generated/field-tips.json" with { type: "json" };

interface FieldTip { field: string; title: string; summary: string; path: string; }
const TIPS = fieldTips as Record<string, FieldTip>;

function textOf(node: Element): string {
  let out = "";
  for (const child of node.children) {
    if (child.type === "text") out += child.value;
    else if (child.type === "element") out += textOf(child as Element);
  }
  return out;
}

export function rehypeFieldTooltip() {
  return (tree: Root) => {
    const visitChildren = (parent: Element | Root, insideSkipped: boolean) => {
      const children = parent.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type !== "element") continue;
        const element = child as Element;
        const skip = insideSkipped || element.tagName === "pre" || element.tagName === "a";

        if (!skip && element.tagName === "code") {
          const text = textOf(element).trim();
          const tip = TIPS[text];
          if (tip) {
            const wrapper: Element = {
              type: "element",
              tagName: "a",
              properties: {
                className: ["field-tip-link"],
                href: tip.path,
                "data-field-tip-id": tip.field,
              },
              children: [element],
            };
            children[i] = wrapper;
            continue;
          }
        }

        // Tag author-written links to known field paths so they get the same popover + underline as auto-wrapped chips.
        if (element.tagName === "a") {
          const props = element.properties ?? {};
          const href = props.href as string | undefined;
          if (href) {
            for (const tip of Object.values(TIPS)) {
              if (tip.path === href) {
                const existingClass = props.className;
                const classList = Array.isArray(existingClass)
                  ? [...(existingClass as string[])]
                  : typeof existingClass === "string" ? existingClass.split(/\s+/).filter(Boolean) : [];
                if (!classList.includes("field-tip-link")) classList.push("field-tip-link");
                props.className = classList;
                props["data-field-tip-id"] = tip.field;
                element.properties = props;
                break;
              }
            }
          }
        }

        visitChildren(element, skip);
      }
    };
    visitChildren(tree, false);
  };
}