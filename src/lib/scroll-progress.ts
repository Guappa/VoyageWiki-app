let bar: HTMLElement | null = null;
let pending = false;

function update(): void {
  pending = false;
  if (!bar) return;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) {
    bar.style.transform = "scaleX(0)";
    return;
  }
  const progress = Math.min(1, Math.max(0, window.scrollY / docHeight));
  bar.style.transform = "scaleX(" + progress.toFixed(4) + ")";
}

function schedule(): void {
  if (pending) return;
  pending = true;
  requestAnimationFrame(update);
}

function init(): void {
  bar = document.querySelector<HTMLElement>(".scroll-progress");
  if (!bar) return;
  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
}

document.addEventListener("astro:page-load", init);
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
