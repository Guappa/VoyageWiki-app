// Links the first prose mention of the validator word family per page to the validator tool.
import type { Root, Element, Text, ElementContent } from "hast";
import type { VFile } from "vfile";

const TARGET = "/tools/validator";
const WORD_PATTERN = /\b(validators?|validations?|validate[sd]?|validating)\b/i;
const SKIP_TAGS = new Set(["pre", "code", "a", "h1", "h2", "h3", "h4", "h5", "h6"]);

// Excluded to avoid self-links: these pages are about the validator itself.
const EXCLUDED_PATH_FRAGMENTS = ["validation-and-size-limits", "tools/validator"];

function sourcePath(file: VFile): string {
  const raw = file?.path ?? file?.history?.[file.history.length - 1] ?? "";
  return raw.replace(/\\/g, "/");
}

export function rehypeValidatorLink() {
  return (tree: Root, file: VFile) => {
    const path = sourcePath(file);
    if (EXCLUDED_PATH_FRAGMENTS.some((fragment) => path.includes(fragment))) return;

    let linked = false;

    const visit = (parent: Element | Root, insideSkipped: boolean) => {
      const children = parent.children;
      for (let i = 0; i < children.length; i++) {
        if (linked) return;
        const child = children[i];

        if (child.type === "text" && !insideSkipped) {
          const match = WORD_PATTERN.exec((child as Text).value);
          if (match) {
            const value = (child as Text).value;
            const start = match.index;
            const end = start + match[0].length;
            const link: Element = {
              type: "element",
              tagName: "a",
              properties: { className: ["validator-link"], href: TARGET },
              children: [{ type: "text", value: value.slice(start, end) }],
            };
            const replacement: ElementContent[] = [];
            if (start > 0) replacement.push({ type: "text", value: value.slice(0, start) });
            replacement.push(link);
            if (end < value.length) replacement.push({ type: "text", value: value.slice(end) });
            children.splice(i, 1, ...replacement);
            linked = true;
            return;
          }
        } else if (child.type === "element") {
          const element = child as Element;
          visit(element, insideSkipped || SKIP_TAGS.has(element.tagName));
          if (linked) return;
        }
      }
    };

    visit(tree, false);
  };
}
