import { visit } from "unist-util-visit";
import { resolveLimitTokens } from "../data/size-limits";

// Replaces {limit:<id>} tokens in prose and code with the rounded display figure so docs never hardcode a limit.
export function remarkSizeLimit() {
  return (tree: unknown): void => {
    visit(tree as never, (node: { type?: string; value?: string }) => {
      if (typeof node.value !== "string") return;
      if (node.type !== "text" && node.type !== "inlineCode" && node.type !== "code") return;
      if (!node.value.includes("{limit:")) return;
      node.value = resolveLimitTokens(node.value);
    });
  };
}
