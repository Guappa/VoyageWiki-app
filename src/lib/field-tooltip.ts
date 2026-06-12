interface FieldTip { field: string; title: string; summary: string; path: string; }

const HOVER_DELAY_MS = 350;
const HIDE_DELAY_MS = 80;

let popover: HTMLElement | null = null;
let titleEl: HTMLElement | null = null;
let summaryEl: HTMLElement | null = null;
let openTimer: ReturnType<typeof setTimeout> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;
let currentTarget: HTMLElement | null = null;

let cachedTips: Record<string, FieldTip> | null = null;
let tipsPromise: Promise<Record<string, FieldTip>> | null = null;

async function loadTips(): Promise<Record<string, FieldTip>> {
  if (cachedTips) return cachedTips;
  if (tipsPromise) return tipsPromise;
  tipsPromise = fetch("/field-tips.json", { credentials: "omit" })
    .then((r) => r.ok ? r.json() : {})
    .then((data: Record<string, FieldTip>) => { cachedTips = data; return data; })
    .catch(() => ({} as Record<string, FieldTip>));
  return tipsPromise;
}

function getTips(): Record<string, FieldTip> {
  // Synchronous read of whatever loadTips() has already cached; callers prefetch on first hover-intent.
  return cachedTips ?? {};
}

function ensurePopover(): HTMLElement {
  if (popover && document.body.contains(popover)) return popover;
  // Popover was removed (e.g. by Astro view-transition body swap); discard the stale reference.
  popover = null;
  titleEl = null;
  summaryEl = null;
  const popoverElement = document.createElement("div");
  popoverElement.className = "field-tip-popover";
  popoverElement.setAttribute("role", "tooltip");
  popoverElement.setAttribute("aria-hidden", "true");
  popoverElement.innerHTML = '<div class="field-tip-popover__title"></div><div class="field-tip-popover__summary"></div><div class="field-tip-popover__hint">click to open page →</div>';
  document.body.appendChild(popoverElement);
  popover = popoverElement;
  titleEl = popoverElement.querySelector(".field-tip-popover__title");
  summaryEl = popoverElement.querySelector(".field-tip-popover__summary");
  return popoverElement;
}

function positionPopover(anchor: HTMLElement): void {
  if (!popover) return;
  const rect = anchor.getBoundingClientRect();
  const popRect = popover.getBoundingClientRect();
  const gap = 6;

  let top = rect.bottom + window.scrollY + gap;
  let left = rect.left + window.scrollX;
  if (rect.bottom + popRect.height + gap > window.innerHeight) {
    top = rect.top + window.scrollY - popRect.height - gap;
  }
  const maxLeft = window.scrollX + window.innerWidth - popRect.width - 8;
  if (left > maxLeft) left = maxLeft;
  if (left < window.scrollX + 8) left = window.scrollX + 8;

  popover.style.top = top + "px";
  popover.style.left = left + "px";
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderInline(text: string): string {
  return escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>");
}

function open(anchor: HTMLElement): void {
  const id = anchor.getAttribute("data-field-tip-id");
  if (!id) return;
  const tip = getTips()[id];
  if (!tip) return;
  const popoverElement = ensurePopover();
  if (titleEl) titleEl.innerHTML = renderInline(tip.title);
  if (summaryEl) summaryEl.innerHTML = renderInline(tip.summary);
  popoverElement.setAttribute("aria-hidden", "false");
  popoverElement.classList.add("is-visible");
  positionPopover(anchor);
  currentTarget = anchor;
}

function close(): void {
  if (!popover) return;
  popover.classList.remove("is-visible");
  popover.setAttribute("aria-hidden", "true");
  currentTarget = null;
}

function clearTimers(): void {
  if (openTimer) { clearTimeout(openTimer); openTimer = null; }
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
}

function onEnter(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const anchor = target.closest<HTMLElement>("a.field-tip-link");
  if (!anchor) return;
  clearTimers();
  // Prefetch on first hover-intent so the JSON is cached before the open delay elapses.
  void loadTips();
  openTimer = setTimeout(() => {
    if (cachedTips) {
      open(anchor);
    } else {
      // Tips not yet loaded; wait for the in-flight fetch, then open.
      void loadTips().then(() => { if (currentTarget !== anchor && anchor.matches(":hover")) open(anchor); });
    }
  }, HOVER_DELAY_MS);
}

function onLeave(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const anchor = target.closest<HTMLElement>("a.field-tip-link");
  if (!anchor) return;
  clearTimers();
  closeTimer = setTimeout(close, HIDE_DELAY_MS);
}

function onClick(event: Event): void {
  // Native link click navigates; just hide our popover.
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!target.closest("a.field-tip-link")) return;
  close();
}

function attach(): void {
  document.addEventListener("mouseover", onEnter, true);
  document.addEventListener("mouseout", onLeave, true);
  document.addEventListener("focusin", onEnter, true);
  document.addEventListener("focusout", onLeave, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("astro:before-swap", close);
  document.addEventListener("scroll", () => {
    if (currentTarget) positionPopover(currentTarget);
  }, { passive: true, capture: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", attach);
} else {
  attach();
}