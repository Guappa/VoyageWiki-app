<script lang="ts">
  import type { NodeKind } from "~/lib/trigger-map/types";

  interface Props {
    hiddenKinds: Set<NodeKind>;
    hideScriptEdges: boolean;
    onchange: (hiddenKinds: Set<NodeKind>, hideScriptEdges: boolean) => void;
  }
  const { hiddenKinds, hideScriptEdges, onchange }: Props = $props();

  const KINDS: { kind: NodeKind; label: string }[] = [
    { kind: "trigger",     label: "Triggers" },
    { kind: "quest",       label: "Quests" },
    { kind: "npc",         label: "NPCs" },
    { kind: "location",    label: "Locations" },
    { kind: "faction",     label: "Factions" },
    { kind: "trait",       label: "Traits" },
    { kind: "storage-key", label: "Storage" },
  ];

  function toggleKind(kind: NodeKind) {
    const next = new Set(hiddenKinds);
    if (next.has(kind)) next.delete(kind);
    else next.add(kind);
    onchange(next, hideScriptEdges);
  }

  function toggleScriptEdges() {
    onchange(hiddenKinds, !hideScriptEdges);
  }
</script>

<div class="filterbar" role="group" aria-label="Node and edge filters">
  {#each KINDS as { kind, label } (kind)}
    <label class="filterbar__item">
      <input
        type="checkbox"
        checked={!hiddenKinds.has(kind)}
        onchange={() => toggleKind(kind)}
      />
      {label}
    </label>
  {/each}
  <span class="filterbar__sep" aria-hidden="true"></span>
  <label class="filterbar__item filterbar__item--script">
    <input
      type="checkbox"
      checked={!hideScriptEdges}
      onchange={toggleScriptEdges}
    />
    Script edges
  </label>
</div>

<style>
  .filterbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .filterbar__item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
  }

  .filterbar__item input { cursor: pointer; }

  .filterbar__sep {
    width: 1px;
    height: 1rem;
    background: var(--color-border);
  }

  /* script-edges toggle uses a slightly dimmer style to signal it controls edges, not nodes */
  .filterbar__item--script { color: var(--color-text-muted); font-style: italic; }
</style>
