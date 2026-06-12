// Same-page hash links otherwise fire Astro's cross-page slide transition; intercept for a smooth in-page scroll instead.
function getHeaderOffset(): number {
  const header = document.querySelector<HTMLElement>(".site-header");
  return (header instanceof HTMLElement ? header.offsetHeight : 56) + 24;
}

function onAnchorClick(event: MouseEvent): void {
  if (event.defaultPrevented) return;
  if (event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const target = event.target;
  if (!(target instanceof Element)) return;
  const anchor = target.closest<HTMLAnchorElement>("a[href]");
  if (!anchor) return;
  if (anchor.target && anchor.target !== "_self") return;

  const href = anchor.getAttribute("href") || "";
  if (!href.includes("#")) return;

  let url: URL;
  try {
    url = new URL(href, location.href);
  } catch {
    return;
  }
  if (url.origin !== location.origin) return;

  const samePath = url.pathname.replace(/\/$/, "") === location.pathname.replace(/\/$/, "");
  if (!samePath) return;
  if (url.search !== location.search) return;
  if (!url.hash) return;

  const id = decodeURIComponent(url.hash.slice(1));
  if (!id) return;
  const element = document.getElementById(id);
  if (!element) return;

  event.preventDefault();
  event.stopPropagation();
  const offset = getHeaderOffset();
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });

  // Keep the URL hash in sync without re-triggering the hashchange auto-scroll.
  history.replaceState(null, "", url.hash);
}

document.addEventListener("click", onAnchorClick, { capture: true });