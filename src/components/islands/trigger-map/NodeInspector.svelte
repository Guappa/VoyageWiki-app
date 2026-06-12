<script lang="ts">
  import type { GraphModel } from "~/lib/trigger-map/types";
  import { findReferencingTriggers } from "~/lib/trigger-map/references";
  import ScriptEditor from "./ScriptEditor.svelte";
  import EntryEditor from "./EntryEditor.svelte";

  interface Props {
    selectedNodeId: string | null;
    model: GraphModel;
    world: any;
    width: number;
    onscriptsave: (triggerName: string, next: string) => void;
    onrename: (oldName: string, newName: string) => boolean;
    onsetrecurring: (triggerName: string, value: boolean) => void;
    onupdateentry: (triggerName: string, list: "conditions" | "effects", index: number, field: string, value: unknown) => void;
    onremoveentry: (triggerName: string, list: "conditions" | "effects", index: number) => void;
    onaddentry: (triggerName: string, list: "conditions" | "effects", entry: Record<string, unknown>) => void;
    onselect: (nodeId: string) => void;
  }
  const { selectedNodeId, model, world, width, onscriptsave, onrename, onsetrecurring, onupdateentry, onremoveentry, onaddentry, onselect }: Props = $props();

  // Resolve kind by matching in model.nodes — keys can contain ':', so don't split on it
  const selectedNode = $derived(
    selectedNodeId ? model.nodes.find((n) => n.id === selectedNodeId) ?? null : null
  );

  const triggerData = $derived(
    selectedNode?.kind === "trigger" && world?.triggers
      ? world.triggers[selectedNode.key] ?? null
      : null
  );

  const references = $derived(
    selectedNode && selectedNode.kind !== "trigger"
      ? findReferencingTriggers(model, selectedNodeId!)
      : []
  );

  // Local draft so a rejected rename (collision/empty) can revert without touching the world.
  let nameDraft = $state("");
  $effect(() => { nameDraft = selectedNode?.key ?? ""; });

  function commitName() {
    if (!selectedNode || nameDraft.trim() === selectedNode.key) return;
    if (!onrename(selectedNode.key, nameDraft)) nameDraft = selectedNode.key;
  }
</script>

{#if selectedNode}
  <div class="inspector" style="width: {width}px">
    {#if selectedNode.kind === "trigger"}
      <div class="inspector__header">
        <input
          class="inspector__title-input"
          bind:value={nameDraft}
          aria-label="Trigger name"
          onblur={commitName}
          onkeydown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        />
        <label class="inspector__recurring" title="Fires every time conditions pass, not just once">
          <input
            type="checkbox"
            checked={!!triggerData?.recurring}
            onchange={(e) => onsetrecurring(selectedNode.key, e.currentTarget.checked)}
          />
          recurring
        </label>
      </div>

      {#if triggerData}
        <EntryEditor
          title="Conditions"
          entries={triggerData.conditions ?? []}
          list="conditions"
          triggerName={selectedNode.key}
          {model}
          {onupdateentry}
          {onremoveentry}
          {onaddentry}
        />

        <EntryEditor
          title="Effects"
          entries={triggerData.effects ?? []}
          list="effects"
          triggerName={selectedNode.key}
          {model}
          {onupdateentry}
          {onremoveentry}
          {onaddentry}
        />

        <section class="inspector__section">
          <h4 class="inspector__section-title">Script</h4>
          {#key selectedNode.key}
            <ScriptEditor
              value={triggerData.script ?? ""}
              onsave={(next) => onscriptsave(selectedNode.key, next)}
            />
          {/key}
        </section>
      {:else}
        <p class="inspector__empty">No trigger data found.</p>
      {/if}
    {:else}
      <div class="inspector__header">
        <h3 class="inspector__title">{selectedNode.key}</h3>
        <span class="inspector__badge inspector__badge--kind">{selectedNode.kind}</span>
      </div>

      <section class="inspector__section">
        <h4 class="inspector__section-title">Referenced by</h4>
        {#if references.length === 0}
          <p class="inspector__empty">No triggers reference this node.</p>
        {:else}
          <ul class="inspector__list">
            {#each references as ref (ref.trigger + ref.relation)}
              <li class="inspector__item">
                <button
                  type="button"
                  class="inspector__ref"
                  onclick={() => onselect(ref.triggerNodeId)}
                  title="Jump to {ref.trigger}"
                >
                  <span class="inspector__trigger-name">{ref.trigger}</span>
                  <span class="inspector__relation">{ref.relation}</span>
                  <span class="inspector__origin inspector__origin--{ref.origin}">{ref.origin}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}
  </div>
{/if}

<style>
  .inspector {
    width: 420px;
    flex-shrink: 0;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-gutter: stable;
    padding: 1rem;
    border-left: 1px solid var(--color-border);
    background: var(--color-bg-infobox);
    font-size: 0.875rem;
  }

  .inspector__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .inspector__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    word-break: break-all;
  }

  .inspector__title-input {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    padding: 2px 5px;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
  }
  .inspector__title-input:hover { border-color: var(--color-border); }
  .inspector__title-input:focus { outline: none; border-color: var(--color-accent); background: var(--color-bg); }

  .inspector__badge {
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 999px;
    background: var(--color-accent);
    color: var(--color-on-link);
    white-space: nowrap;
  }

  .inspector__badge--kind {
    background: transparent;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
  }

  .inspector__recurring {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    cursor: pointer;
    user-select: none;
  }
  .inspector__recurring input { cursor: pointer; }

  .inspector__section {
    margin-bottom: 1rem;
  }

  .inspector__section-title {
    margin: 0 0 0.35rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .inspector__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .inspector__item {
    padding: 0;
  }

  .inspector__ref {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    width: 100%;
    border: none;
    background: none;
    padding: 0.2rem 0.3rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    text-align: left;
  }
  .inspector__ref:hover { background: var(--color-bg-subtle); }
  .inspector__ref:hover .inspector__trigger-name { text-decoration: underline; }

  .inspector__trigger-name {
    font-family: var(--font-mono);
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--color-accent);
  }

  .inspector__relation {
    font-size: 0.78rem;
    color: var(--color-text-muted);
  }

  .inspector__origin {
    font-size: 0.7rem;
    padding: 1px 5px;
    border-radius: 4px;
  }

  .inspector__origin--structured {
    background: color-mix(in srgb, var(--color-accent), transparent 88%);
    color: var(--color-accent);
    border: 1px solid color-mix(in srgb, var(--color-accent), transparent 70%);
  }

  /* script origin uses warning tone to signal it is inferred, not manually authored */
  .inspector__origin--script {
    background: color-mix(in srgb, var(--color-warning), transparent 88%);
    color: var(--color-warning);
    border: 1px dashed color-mix(in srgb, var(--color-warning), transparent 70%);
  }

  .inspector__empty {
    margin: 0;
    color: var(--color-text-muted);
    font-style: italic;
  }
</style>
