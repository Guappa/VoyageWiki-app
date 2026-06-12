// Astro forces scrollRestoration 'manual', which makes F5 land inconsistently; restore native so reloads return to the saved position.
if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'auto';
}
// Re-assert on Astro's swap so it doesn't flip back to manual.
document.addEventListener('astro:after-swap', () => {
  if ('scrollRestoration' in history) history.scrollRestoration = 'auto';
});

function getHeaderOffset(): number {
  const header = document.querySelector<HTMLElement>(".site-header");
  const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 56;
  return headerHeight + 24;
}

function scrollToHashWithOffset(): void {
  if (typeof window === "undefined" || !location.hash) return;
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const element = document.getElementById(id);
  if (!element) return;
  const offset = getHeaderOffset();
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "instant" });
}

function onHashChange(): void {
  requestAnimationFrame(() => requestAnimationFrame(scrollToHashWithOffset));
}

function onPageLoad(): void {
  requestAnimationFrame(() => requestAnimationFrame(scrollToHashWithOffset));
}


document.addEventListener("astro:page-load", onPageLoad);
window.addEventListener("hashchange", onHashChange);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onPageLoad);
} else {
  onPageLoad();
}
