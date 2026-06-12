<script lang="ts">
  interface Props {
    viewMode: "graph" | "dependency";
  }
  const { viewMode }: Props = $props();

  const KINDS = [
    { label: "Trigger", color: "#4c8dff" },
    { label: "Quest", color: "#d29922" },
    { label: "NPC", color: "#2da44e" },
    { label: "Location", color: "#a371f7" },
    { label: "Faction", color: "#e0569e" },
    { label: "Trait", color: "#1f9aa8" },
    { label: "Storage key", color: "var(--color-text-muted)", dashed: true },
  ];

  const ROLES = [
    { label: "Entry (fires at start / nothing precedes it)", color: "#2da44e" },
    { label: "Link (depends on and feeds others)", color: "#4c8dff" },
    { label: "Terminal (nothing depends on it)", color: "#a371f7" },
    { label: "Accumulator (recurring counter loop)", color: "#e0569e" },
    { label: "Recurring (fires repeatedly)", color: "#d29922" },
    { label: "Isolated (no trigger dependencies)", color: "var(--color-text-muted)", dashed: true },
  ];

  const swatches = $derived(viewMode === "dependency" ? ROLES : KINDS);
  const swatchTitle = $derived(viewMode === "dependency" ? "Trigger roles" : "Node types");

  const BASE_TIPS = [
    { keys: "Click", desc: "edit a node in the side panel" },
    { keys: "Right-click", desc: "add, rename, duplicate, delete, re-arrange" },
    { keys: "Ctrl / ⌘ + Z", desc: "undo the last change" },
    { keys: "Drag a panel edge", desc: "resize the navigator or inspector" },
  ];
  const CONNECT_TIP = { keys: "Drag from a trigger's dot", desc: "connect it to an entity" };

  // Dependency edges are derived, not authored, so the connect tip only applies in graph view.
  const tips = $derived(viewMode === "dependency" ? BASE_TIPS : [BASE_TIPS[0], CONNECT_TIP, ...BASE_TIPS.slice(1)]);
</script>

<section class="tm-legend" aria-label="Legend and shortcuts">
  <div class="tm-legend__group">
    <h4 class="tm-legend__title">{swatchTitle}</h4>
    <ul class="tm-legend__list">
      {#each swatches as item}
        <li class="tm-legend__row">
          <span
            class="tm-legend__swatch"
            class:tm-legend__swatch--dashed={item.dashed}
            style="border-color: {item.color}; background: color-mix(in srgb, {item.color} 14%, var(--color-bg));"
          ></span>
          {item.label}
        </li>
      {/each}
    </ul>
  </div>

  {#if viewMode === "graph"}
    <div class="tm-legend__group">
      <h4 class="tm-legend__title">Edges</h4>
      <ul class="tm-legend__list">
        <li class="tm-legend__row"><span class="tm-legend__edge"></span>structured (conditions / effects)</li>
        <li class="tm-legend__row"><span class="tm-legend__edge tm-legend__edge--dashed"></span>inferred from a script</li>
      </ul>
    </div>
  {:else}
    <div class="tm-legend__group">
      <h4 class="tm-legend__title">Edges</h4>
      <ul class="tm-legend__list">
        <li class="tm-legend__row"><span class="tm-legend__edge"></span>A produces what B depends on (A → B)</li>
        <li class="tm-legend__row"><span class="tm-legend__edge tm-legend__edge--dashed"></span>script gate</li>
      </ul>
    </div>
  {/if}

  <div class="tm-legend__group tm-legend__group--wide">
    <h4 class="tm-legend__title">Shortcuts</h4>
    <ul class="tm-legend__list">
      {#each tips as tip}
        <li class="tm-legend__row">
          <kbd class="tm-legend__kbd">{tip.keys}</kbd>
          <span class="tm-legend__desc">{tip.desc}</span>
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .tm-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem 2.5rem;
    margin-top: 0.75rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-subtle);
    font-size: 0.82rem;
  }

  .tm-legend__group { min-width: 0; }
  .tm-legend__group--wide { flex: 1; min-width: 240px; }

  .tm-legend__title {
    margin: 0 0 0.4rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .tm-legend__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .tm-legend__row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text);
  }

  .tm-legend__swatch {
    flex: 0 0 auto;
    width: 22px;
    height: 14px;
    border: 1px solid;
    border-radius: 3px;
  }
  .tm-legend__swatch--dashed { border-style: dashed; }

  .tm-legend__edge {
    flex: 0 0 auto;
    width: 22px;
    border-top: 2px solid var(--color-text-muted);
  }
  .tm-legend__edge--dashed { border-top-style: dashed; }

  .tm-legend__kbd {
    flex: 0 0 auto;
    padding: 1px 6px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    white-space: nowrap;
  }
  .tm-legend__desc { color: var(--color-text-muted); }
</style>
