let observer: IntersectionObserver | null = null;
const visibleHeadings = new Map<string, number>();

function clearActive(): void {
  document.querySelectorAll(".page-toc__link.is-active").forEach((el) => {
    el.classList.remove("is-active");
  });
}

function setActive(slug: string): void {
  clearActive();
  const link = document.querySelector<HTMLElement>('.page-toc__link[data-toc-slug="' + slug + '"]');
  if (link) link.classList.add("is-active");
}

function pickActive(): void {
  if (visibleHeadings.size === 0) return;
  let best: { slug: string; y: number } | null = null;
  for (const [slug, y] of visibleHeadings) {
    if (best === null || y < best.y) best = { slug, y };
  }
  if (best) setActive(best.slug);
}

function init(): void {
  if (observer) {
    observer.disconnect();
    visibleHeadings.clear();
  }
  const headings = document.querySelectorAll<HTMLElement>(".section-article :where(h2, h3, h4, h5)[id]");
  if (headings.length < 3) return;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        const id = target.id;
        if (entry.isIntersecting) {
          visibleHeadings.set(id, entry.boundingClientRect.top);
        } else {
          visibleHeadings.delete(id);
        }
      }
      pickActive();
    },
    {
      // -80px top band offsets the sticky header so headings activate near the top, not on first appearance.
      rootMargin: "-80px 0px -65% 0px",
      threshold: 0,
    }
  );

  headings.forEach((h) => observer!.observe(h));

  // Activate the first heading immediately so the ToC isn't blank on load
  if (headings[0]) setActive(headings[0].id);
}

document.addEventListener("astro:page-load", init);
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
