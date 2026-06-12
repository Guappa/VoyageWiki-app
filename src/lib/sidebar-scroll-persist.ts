const STORAGE_KEY = "voyagewiki:sidebar-scroll";

function getSidebar(): HTMLElement | null {
  return document.querySelector("[data-sidebar]");
}

function saveScroll(): void {
  const sidebar = getSidebar();
  if (!sidebar) return;
  try { sessionStorage.setItem(STORAGE_KEY, String(sidebar.scrollTop)); } catch (e) { void e; }
}

function ensureActiveVisible(sidebar: HTMLElement): void {
  const active = sidebar.querySelector<HTMLElement>(".sidebar-nav__link.is-active");
  if (!active) return;
  const sidebarRect = sidebar.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();
  const margin = 24;
  const isAbove = activeRect.top < sidebarRect.top + margin;
  const isBelow = activeRect.bottom > sidebarRect.bottom - margin;
  if (isAbove || isBelow) {
    // Scroll only the sidebar; scrollIntoView() would also nudge the window down on every page load.
    const activeCenter = active.offsetTop + active.offsetHeight / 2;
    sidebar.scrollTop = activeCenter - sidebar.clientHeight / 2;
  }
}

function restoreScroll(): void {
  const sidebar = getSidebar();
  if (!sidebar) return;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const top = raw === null ? 0 : Number.parseInt(raw, 10);
    if (!Number.isNaN(top)) sidebar.scrollTop = top;
  } catch (e) { void e; }
  ensureActiveVisible(sidebar);
}

document.addEventListener("astro:before-swap", saveScroll);
document.addEventListener("astro:after-swap", restoreScroll);
document.addEventListener("astro:page-load", restoreScroll);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { const sb = getSidebar(); if (sb) ensureActiveVisible(sb); });
} else {
  const sb = getSidebar();
  if (sb) ensureActiveVisible(sb);
}
