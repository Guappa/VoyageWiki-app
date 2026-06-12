const BODY_OPEN_CLASS = "sidebar-open";

function getToggleButton(): HTMLButtonElement | null {
  return document.querySelector("[data-sidebar-toggle]");
}
function getSidebar(): HTMLElement | null {
  return document.querySelector("[data-sidebar]");
}
function getBackdrop(): HTMLElement | null {
  return document.querySelector("[data-sidebar-backdrop]");
}

function openDrawer(): void {
  document.body.classList.add(BODY_OPEN_CLASS);
  const btn = getToggleButton();
  if (btn) btn.setAttribute("aria-expanded", "true");
  const backdrop = getBackdrop();
  if (backdrop) backdrop.setAttribute("aria-hidden", "false");
}
function closeDrawer(): void {
  document.body.classList.remove(BODY_OPEN_CLASS);
  const btn = getToggleButton();
  if (btn) btn.setAttribute("aria-expanded", "false");
  const backdrop = getBackdrop();
  if (backdrop) backdrop.setAttribute("aria-hidden", "true");
}
function toggleDrawer(): void {
  if (document.body.classList.contains(BODY_OPEN_CLASS)) closeDrawer(); else openDrawer();
}

const WIRED = "data-drawer-wired";
function once(el: Element | null, event: string, handler: EventListener): void {
  if (!el || el.hasAttribute(WIRED + "-" + event)) return;
  el.setAttribute(WIRED + "-" + event, "true");
  el.addEventListener(event, handler);
}

function wire(): void {
  once(getToggleButton(), "click", toggleDrawer);
  once(getBackdrop(), "click", closeDrawer);
  const sidebar = getSidebar();
  if (sidebar) {
    once(sidebar, "click", (e) => {
      const target = (e as MouseEvent).target as HTMLElement;
      if (target && target.tagName === "A") closeDrawer();
    });
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains(BODY_OPEN_CLASS)) {
    closeDrawer();
  }
});

document.addEventListener("astro:page-load", wire);

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
}
