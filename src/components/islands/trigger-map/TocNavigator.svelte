<script lang="ts">
  import type { GraphModel, NodeKind, GraphNode } from "~/lib/trigger-map/types";

  interface Props {
    model: GraphModel;
    onselect: (nodeId: string) => void;
  }
  const { model, onselect }: Props = $props();

  const SECTIONS: { kind: NodeKind; heading: string }[] = [
    { kind: "trigger",     heading: "Triggers" },
    { kind: "quest",       heading: "Quests" },
    { kind: "npc",         heading: "NPCs" },
    { kind: "location",    heading: "Locations" },
    { kind: "faction",     heading: "Factions" },
    { kind: "storage-key", heading: "Storage" },
  ];

  let query = $state("");
  let collapsed = $state<Record<string, boolean>>({});

  const grouped = $derived.by(() => {
    const normalizedQuery = query.toLowerCase();
    return SECTIONS.map(({ kind, heading }) => {
      const nodes = model.nodes
        .filter((n) => n.kind === kind && (normalizedQuery === "" || n.key.toLowerCase().includes(normalizedQuery)));
      return { kind, heading, nodes };
    }).filter((s) => s.nodes.length > 0 || query === "");
  });

  function toggleSection(kind: string) {
    collapsed[kind] = !collapsed[kind];
  }
</script>

<nav class="toc" aria-label="Node navigator">
  <input
    class="toc__search"
    type="search"
    placeholder="Search nodes…"
    bind:value={query}
    aria-label="Filter nodes"
  />

  {#each grouped as section (section.kind)}
    {@const isCollapsed = !!collapsed[section.kind]}
    <div class="toc__section">
      <button
        class="toc__heading"
        type="button"
        aria-expanded={!isCollapsed}
        onclick={() => toggleSection(section.kind)}
      >
        <span class="toc__chevron" class:toc__chevron--open={!isCollapsed}>›</span>
        {section.heading}
        <span class="toc__count">{section.nodes.length}</span>
      </button>

      {#if !isCollapsed}
        <ul class="toc__list">
          {#each section.nodes as node (node.id)}
            <li>
              <button
                class="toc__entry toc__entry--{section.kind}"
                type="button"
                onclick={() => onselect(node.id)}
                title={node.key}
              >{node.key}</button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/each}

  {#if grouped.length === 0}
    <p class="toc__empty">No matches.</p>
  {/if}
</nav>

<style>
  .toc {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    border-right: 1px solid var(--color-border);
    background: var(--color-bg-subtle);
    display: flex;
    flex-direction: column;
    gap: 0;
    font-size: 0.82rem;
  }

  .toc__search {
    margin: 0.5rem;
    padding: 0.3rem 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.8rem;
    width: calc(100% - 1rem);
    box-sizing: border-box;
  }
  .toc__search:focus { outline: 2px solid var(--color-accent); outline-offset: 1px; }

  .toc__section { border-bottom: 1px solid var(--color-border-subtle); }

  .toc__heading {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    width: 100%;
    padding: 0.35rem 0.5rem;
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: pointer;
    text-align: left;
  }
  .toc__heading:hover { color: var(--color-text); background: var(--color-bg-code-toolbar); }

  .toc__chevron {
    display: inline-block;
    transform: rotate(0deg);
    transition: transform 0.15s;
    font-size: 0.9rem;
    line-height: 1;
  }
  .toc__chevron--open { transform: rotate(90deg); }

  .toc__count {
    margin-left: auto;
    background: var(--color-border);
    color: var(--color-text-muted);
    border-radius: 999px;
    padding: 0 5px;
    font-size: 0.7rem;
    font-variant-numeric: tabular-nums;
  }

  .toc__list {
    list-style: none;
    margin: 0;
    padding: 0 0 0.25rem;
  }

  .toc__entry {
    display: block;
    width: 100%;
    padding: 0.25rem 0.75rem;
    background: none;
    border: none;
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    line-height: 1.3;
    cursor: pointer;
    text-align: left;
    /* wrap long keys so the full name is always readable rather than ellipsis-clipped */
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .toc__entry:hover { background: var(--color-bg-code-toolbar); color: var(--color-accent); }

  .toc__empty {
    margin: 1rem 0.5rem;
    color: var(--color-text-muted);
    font-style: italic;
  }
</style>
