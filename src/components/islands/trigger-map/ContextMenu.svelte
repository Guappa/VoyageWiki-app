<script lang="ts">
  export interface ContextItem {
    label: string;
    onclick: () => void;
    danger?: boolean;
  }

  interface Props {
    items: ContextItem[];
    x: number;
    y: number;
    onclose: () => void;
  }
  const { items, x, y, onclose }: Props = $props();

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") onclose();
  }

  function handlePointerDown(event: PointerEvent) {
    if (!(event.target as HTMLElement).closest(".tm-context-menu")) onclose();
  }
</script>

<svelte:window onkeydown={handleKeyDown} onpointerdown={handlePointerDown} />

<ul
  class="tm-context-menu"
  style="left:{x}px; top:{y}px"
  role="menu"
  aria-label="Context menu"
>
  {#each items as item, i (i)}
    <li role="none">
      <button
        class="tm-context-menu__item"
        class:tm-context-menu__item--danger={item.danger}
        role="menuitem"
        onmousedown={(e) => { e.stopPropagation(); item.onclick(); onclose(); }}
      >
        {item.label}
      </button>
    </li>
  {/each}
</ul>

<style>
  .tm-context-menu {
    position: absolute;
    z-index: 1000;
    background: var(--color-bg-infobox);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-card);
    list-style: none;
    margin: 0;
    padding: 0.25rem 0;
    min-width: 180px;
    overflow: hidden;
  }

  .tm-context-menu__item {
    display: block;
    width: 100%;
    padding: 0.4rem 0.85rem;
    background: transparent;
    border: none;
    color: var(--color-text);
    font-size: 0.82rem;
    text-align: left;
    cursor: pointer;
  }

  .tm-context-menu__item:hover {
    background: var(--color-bg-code-toolbar);
  }

  .tm-context-menu__item--danger {
    color: var(--color-error);
  }

  .tm-context-menu__item--danger:hover {
    background: color-mix(in srgb, var(--color-error) 12%, transparent);
  }
</style>
