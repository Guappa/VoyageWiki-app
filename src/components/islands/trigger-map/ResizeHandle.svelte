<script lang="ts">
  interface Props {
    ondrag: (deltaX: number) => void;
    onend?: () => void;
    label: string;
  }
  const { ondrag, onend, label }: Props = $props();

  let dragging = false;
  let lastX = 0;

  function pointerdown(e: PointerEvent) {
    dragging = true;
    lastX = e.clientX;
    // Capture so a fast drag that leaves the thin handle still tracks.
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function pointermove(e: PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    if (dx === 0) return;
    lastX = e.clientX;
    ondrag(dx);
  }

  function endDrag(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    onend?.();
  }

  function keydown(e: KeyboardEvent) {
    const step = e.key === "ArrowLeft" ? -16 : e.key === "ArrowRight" ? 16 : 0;
    if (!step) return;
    e.preventDefault();
    ondrag(step);
    onend?.();
  }
</script>

<div
  class="resize-handle"
  role="separator"
  aria-orientation="vertical"
  aria-label={label}
  tabindex="0"
  onpointerdown={pointerdown}
  onpointermove={pointermove}
  onpointerup={endDrag}
  onpointercancel={endDrag}
  onkeydown={keydown}
></div>

<style>
  .resize-handle {
    flex: 0 0 6px;
    align-self: stretch;
    cursor: col-resize;
    background: transparent;
    border: none;
    padding: 0;
  }
  .resize-handle:hover,
  .resize-handle:focus-visible { background: var(--color-accent); outline: none; }
</style>
