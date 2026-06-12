import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Mirrors Validator.svelte's dual-theme highlight so script editing matches the rest of the wiki.
const HIGHLIGHT_DARK = HighlightStyle.define([
  { tag: t.keyword, color: "#569CD6" },
  { tag: t.string, color: "#B5C677" },
  { tag: t.number, color: "#B5CEA8" },
  { tag: t.bool, color: "#569CD6" },
  { tag: t.null, color: "#569CD6" },
  { tag: t.variableName, color: "#9CDCFE" },
  { tag: t.function(t.variableName), color: "#DCDCAA" },
  { tag: [t.punctuation, t.brace, t.bracket, t.separator], color: "#D4D4D4" },
]);

const HIGHLIGHT_LIGHT = HighlightStyle.define([
  { tag: t.keyword, color: "#AF00DB" },
  { tag: t.string, color: "#5C6E1F" },
  { tag: t.number, color: "#098658" },
  { tag: t.bool, color: "#AF00DB" },
  { tag: t.null, color: "#AF00DB" },
  { tag: t.variableName, color: "#001080" },
  { tag: t.function(t.variableName), color: "#795E26" },
  { tag: [t.punctuation, t.brace, t.bracket, t.separator], color: "#24292E" },
]);

export function currentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function highlightStyleFor(theme: "light" | "dark"): HighlightStyle {
  return theme === "dark" ? HIGHLIGHT_DARK : HIGHLIGHT_LIGHT;
}
