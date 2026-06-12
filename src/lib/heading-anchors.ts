const COPY_FEEDBACK_MS = 1500;

function buildAnchorLink(heading: HTMLElement): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = "heading-anchor";
  link.href = "#" + heading.id;
  link.setAttribute("aria-label", "Copy link to " + heading.textContent);
  link.textContent = "#";
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const url = location.origin + location.pathname.replace(/\/$/, "") + "#" + heading.id;
    history.replaceState(null, "", "#" + heading.id);
    try {
      navigator.clipboard.writeText(url).catch(() => {});
      const original = link.textContent;
      link.textContent = "✓";
      setTimeout(() => { link.textContent = original; }, COPY_FEEDBACK_MS);
    } catch (_ignored) { void _ignored; }
  });
  return link;
}

function inject(): void {
  const headings = document.querySelectorAll<HTMLElement>(".section-article h2[id], .section-article h3[id], .section-article h4[id]");
  headings.forEach((heading) => {
    if (heading.querySelector(".heading-anchor")) return;
    // A <summary> is interactive; nesting an anchor inside it breaks ARIA and screen-reader nav.
    if (heading.closest("summary")) return;
    heading.appendChild(buildAnchorLink(heading));
  });
}

document.addEventListener("astro:page-load", inject);
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inject);
} else {
  inject();
}
