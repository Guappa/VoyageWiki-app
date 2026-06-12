const COLLAPSE_THRESHOLD_LINES = 30;
const COLLAPSED_LABEL = "Show full code";
const COLLAPSE_CLASS = "code-block--collapsed";
const NEWLINE = String.fromCharCode(10);

function lineCount(pre: HTMLPreElement): number {
  return pre.innerText.split(NEWLINE).length;
}

function attachExpander(wrapper: HTMLElement, lines: number): void {
  if (wrapper.dataset.expanderAttached === "true") return;
  wrapper.dataset.expanderAttached = "true";
  wrapper.classList.add(COLLAPSE_CLASS);

  const expandBar = document.createElement("button");
  expandBar.type = "button";
  expandBar.className = "code-block__expand-bar";
  const COLLAPSED_TEXT = "▼ " + COLLAPSED_LABEL + " (" + lines + " lines)";
  const EXPANDED_TEXT = "▲ Collapse";
  expandBar.textContent = COLLAPSED_TEXT;

  function toggle(): void {
    const isCollapsed = wrapper.classList.toggle(COLLAPSE_CLASS);
    expandBar.textContent = isCollapsed ? COLLAPSED_TEXT : EXPANDED_TEXT;
  }

  expandBar.addEventListener("click", toggle);
  wrapper.appendChild(expandBar);
}

export function attachAutoCollapse(): void {
  const wrappers = document.querySelectorAll<HTMLElement>(".code-block");
  wrappers.forEach((wrapper) => {
    const pre = wrapper.querySelector<HTMLPreElement>("pre");
    if (!pre) return;
    const lines = lineCount(pre);
    if (lines > COLLAPSE_THRESHOLD_LINES) {
      attachExpander(wrapper, lines);
    }
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachAutoCollapse);
  } else {
    attachAutoCollapse();
  }
  document.addEventListener("astro:page-load", attachAutoCollapse);
}
