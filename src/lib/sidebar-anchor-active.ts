const ACTIVE_CLASS = "is-active-anchor";
const TOP_OFFSET = 96;
let trackedTargets: Array<{ id: string; href: string; element: HTMLElement }> = [];
let rafQueued = false;

function setActiveByHref(targetHref: string | null): void {
  const links = document.querySelectorAll<HTMLAnchorElement>(".sidebar-nav__sublink");
  links.forEach((link) => {
    if (targetHref && link.getAttribute("href") === targetHref) {
      link.classList.add(ACTIVE_CLASS);
    } else {
      link.classList.remove(ACTIVE_CLASS);
    }
  });
}

function pickActiveHref(): string | null {
  if (trackedTargets.length === 0) return null;
  const scrollY = window.scrollY;
  const viewportHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  const nearBottom = scrollY + viewportHeight >= docHeight - 8;

  let active: { href: string } | null = null;
  for (const target of trackedTargets) {
    const top = target.element.getBoundingClientRect().top + scrollY;
    if (top - TOP_OFFSET <= scrollY) {
      active = target;
    } else {
      break;
    }
  }

  if (nearBottom) {
    let lastVisible: { href: string } | null = null;
    for (const target of trackedTargets) {
      const rect = target.element.getBoundingClientRect();
      if (rect.top < viewportHeight && rect.bottom > 0) lastVisible = target;
    }
    if (lastVisible) active = lastVisible;
  }

  return active ? active.href : null;
}

function onScroll(): void {
  if (rafQueued) return;
  rafQueued = true;
  requestAnimationFrame(() => {
    rafQueued = false;
    setActiveByHref(pickActiveHref());
  });
}

function setupSpy(): void {
  trackedTargets = [];
  const sublinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".sidebar-nav__sublink"));
  for (const link of sublinks) {
    const href = link.getAttribute("href") ?? "";
    const hashIndex = href.indexOf("#");
    if (hashIndex < 0) continue;
    const id = decodeURIComponent(href.slice(hashIndex + 1));
    if (!id) continue;
    const element = document.getElementById(id);
    if (element) trackedTargets.push({ id, href, element });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function teardownSpy(): void {
  window.removeEventListener("scroll", onScroll);
  trackedTargets = [];
}

function onHashChange(): void {
  const hash = location.hash;
  if (!hash) return;
  const path = location.pathname.replace(/\/$/, "") || "";
  setActiveByHref(path + hash);
}

function init(): void {
  setupSpy();
  if (location.hash) onHashChange();
}

window.addEventListener("hashchange", onHashChange);
document.addEventListener("astro:page-load", init);
document.addEventListener("astro:before-swap", teardownSpy);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
