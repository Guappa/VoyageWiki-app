import type { Root, Element, ElementContent } from "hast";
import { visit } from "unist-util-visit";

function isPreElement(node: Element): boolean {
  return node.tagName === "pre";
}

function readDataLanguageFromProps(node: Element): string | null {
  const props = (node.properties ?? {}) as Record<string, unknown>;
  const candidates = ["dataLanguage", "data-language", "dataLang"];
  for (const key of candidates) {
    const value = props[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

function readLanguageFromClass(node: Element): string | null {
  const className = node.properties?.className;
  if (!Array.isArray(className)) return null;
  const match = className
    .map((c) => String(c))
    .find((c) => c.startsWith("language-"));
  return match ? match.slice("language-".length) : null;
}

function findCodeChild(preNode: Element): Element | null {
  for (const child of preNode.children) {
    if (child.type === "element" && (child as Element).tagName === "code") {
      return child as Element;
    }
  }
  return null;
}

function normaliseLanguage(lang: string): string {
  if (lang === "plaintext" || lang === "text" || lang === "txt") return "text";
  return lang;
}

function detectLanguage(preNode: Element): string {
  const fromPreData = readDataLanguageFromProps(preNode);
  if (fromPreData) return fromPreData;

  const fromPreClass = readLanguageFromClass(preNode);
  if (fromPreClass) return fromPreClass;

  const codeChild = findCodeChild(preNode);
  if (codeChild) {
    const fromCodeData = readDataLanguageFromProps(codeChild);
    if (fromCodeData) return fromCodeData;
    const fromCodeClass = readLanguageFromClass(codeChild);
    if (fromCodeClass) return fromCodeClass;
  }

  return "text";
}

function detectAndNormalise(preNode: Element): string {
  return normaliseLanguage(detectLanguage(preNode));
}

function buildToolbar(language: string): Element {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["code-block__toolbar"] },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["code-block__lang"] },
        children: [{ type: "text", value: language }]
      },
      {
        type: "element",
        tagName: "button",
        properties: {
          type: "button",
          className: ["code-block__copy"],
          "data-copy-button": "true",
          "aria-label": "Copy code to clipboard"
        },
        children: [{ type: "text", value: "Copy" }]
      }
    ]
  };
}

function isAlreadyWrapped(parent: Element | Root): boolean {
  if (parent.type !== "element") return false;
  const className = (parent as Element).properties?.className;
  if (!Array.isArray(className)) return false;
  return className.map((c) => String(c)).includes("code-block");
}

export function rehypeCodeBlockToolbar() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (!isPreElement(node) || !parent || index === undefined) return;
      if (isAlreadyWrapped(parent as Element | Root)) return;

      const language = detectAndNormalise(node);
      const wrapped: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["code-block"], "data-language": language },
        children: [buildToolbar(language), node as ElementContent]
      };
      (parent.children as ElementContent[])[index] = wrapped;
    });
  };
}
