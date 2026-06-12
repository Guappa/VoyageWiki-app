<script lang="ts">
  import type { GraphModel, NodeKind } from "~/lib/trigger-map/types";
  import { entryFieldSpec, entryTypesFor, buildDefaultEntry } from "~/lib/trigger-map/entry-fields";

  interface Props {
    title: string;
    entries: any[];
    list: "conditions" | "effects";
    triggerName: string;
    model: GraphModel;
    onupdateentry: (triggerName: string, list: "conditions" | "effects", index: number, field: string, value: unknown) => void;
    onremoveentry: (triggerName: string, list: "conditions" | "effects", index: number) => void;
    onaddentry: (triggerName: string, list: "conditions" | "effects", entry: Record<string, unknown>) => void;
  }
  const { title, entries, list, triggerName, model, onupdateentry, onremoveentry, onaddentry }: Props = $props();

  const TYPES = entryTypesFor(list);
  const entryNoun = list === "conditions" ? "condition" : "effect";

  function nodeKeysOfKind(...kinds: NodeKind[]): string[] {
    return model.nodes.filter((n) => kinds.includes(n.kind)).map((n) => n.key);
  }

  // Existing nodes of the referenced kind, with the current value folded in so an off-graph value still shows.
  function refOptions(kind: NodeKind, current: unknown): string[] {
    return mergeCurrent(nodeKeysOfKind(kind), current);
  }

  function comboOptions(kinds: NodeKind[], current: unknown): string[] {
    return mergeCurrent(nodeKeysOfKind(...kinds), current);
  }

  function mergeCurrent(keys: string[], current: unknown): string[] {
    const currentValue = typeof current === "string" ? current : "";
    if (currentValue && !keys.includes(currentValue)) keys.push(currentValue);
    return keys.sort();
  }

  let adding = $state(false);
  let addType = $state(TYPES[0]);

  function confirmAdd() {
    onaddentry(triggerName, list, buildDefaultEntry(list, addType));
    adding = false;
  }

  function commitNumber(index: number, raw: string) {
    const parsedNumber = Number(raw);
    if (!Number.isNaN(parsedNumber)) onupdateentry(triggerName, list, index, "value", parsedNumber);
  }

  function jsonText(value: unknown): string {
    if (value == null) return "";
    return typeof value === "string" ? value : JSON.stringify(value);
  }

  // Arrays parse from JSON; a bare element (add/remove) that is not valid JSON is kept as the raw string.
  function commitJson(index: number, raw: string) {
    try {
      onupdateentry(triggerName, list, index, "value", JSON.parse(raw));
    } catch {
      onupdateentry(triggerName, list, index, "value", raw);
    }
  }
</script>

<section class="inspector__section">
  <h4 class="inspector__section-title">{title}</h4>

  {#if entries.length}
    <ul class="entry-list">
      {#each entries as entry, index (index)}
        {@const spec = entryFieldSpec(list, entry.type)}
        <li class="entry-row">
          <span class="entry-tag">{entry.type}</span>

          <div class="entry-fields">
            {#if spec?.keyField}
              {@const kf = spec.keyField}
              {#if kf.control === "ref" && kf.node}
                {@const keyOpts = refOptions(kf.node, entry[kf.field])}
                <select
                  class="entry-op"
                  aria-label="{entry.type} {kf.field}"
                  onchange={(e) => onupdateentry(triggerName, list, index, kf.field, e.currentTarget.value)}
                >
                  {#each keyOpts as o}<option value={o} selected={o === entry[kf.field]}>{o}</option>{/each}
                </select>
              {:else if kf.control === "combo"}
                {@const listId = `combo-${list}-${index}`}
                {@const comboOpts = comboOptions(kf.nodes ?? [], entry[kf.field])}
                <input
                  class="entry-field entry-field--key"
                  type="text"
                  list={listId}
                  value={entry[kf.field] ?? ""}
                  aria-label="{entry.type} {kf.field}"
                  onchange={(e) => onupdateentry(triggerName, list, index, kf.field, e.currentTarget.value)}
                />
                <datalist id={listId}>
                  {#each comboOpts as o}<option value={o}></option>{/each}
                </datalist>
              {:else}
                <input
                  class="entry-field entry-field--key"
                  type="text"
                  value={entry[kf.field] ?? ""}
                  aria-label="{entry.type} {kf.field}"
                  onchange={(e) => onupdateentry(triggerName, list, index, kf.field, e.currentTarget.value)}
                />
              {/if}
            {:else if !spec && typeof entry.key === "string"}
              <input
                class="entry-field entry-field--key"
                type="text"
                value={entry.key}
                aria-label="{entry.type} key"
                onchange={(e) => onupdateentry(triggerName, list, index, "key", e.currentTarget.value)}
              />
            {/if}

            {#if spec?.operators}
              {@const ops = spec.operators.includes(entry.operator) ? spec.operators : [...spec.operators, entry.operator]}
              <select
                class="entry-op"
                aria-label="{entry.type} operator"
                onchange={(e) => onupdateentry(triggerName, list, index, "operator", e.currentTarget.value)}
              >
                {#each ops as op}<option value={op} selected={op === entry.operator}>{op}</option>{/each}
              </select>
            {:else if typeof entry.operator === "string"}
              <input
                class="entry-field"
                type="text"
                value={entry.operator}
                aria-label="{entry.type} operator"
                onchange={(e) => onupdateentry(triggerName, list, index, "operator", e.currentTarget.value)}
              />
            {/if}

            {#if spec?.prose}
              {@const field = spec.prose}
              <textarea
                class="entry-prose"
                rows="3"
                aria-label="{entry.type} {field}"
                value={entry[field] ?? ""}
                onchange={(e) => onupdateentry(triggerName, list, index, field, e.currentTarget.value)}
              ></textarea>
            {:else if spec?.value.control === "bool" || (!spec && typeof entry.value === "boolean")}
              <button
                class="entry-bool"
                class:entry-bool--true={entry.value}
                type="button"
                aria-label="Toggle {entry.type} value"
                onclick={() => onupdateentry(triggerName, list, index, "value", !entry.value)}
              >{entry.value}</button>
            {:else if spec?.value.control === "number" || (!spec && typeof entry.value === "number")}
              <input
                class="entry-field entry-field--value"
                type="number"
                value={entry.value}
                aria-label="{entry.type} value"
                onchange={(e) => commitNumber(index, e.currentTarget.value)}
              />
            {:else if spec?.value.control === "json"}
              <input
                class="entry-field entry-field--value"
                type="text"
                value={jsonText(entry.value)}
                aria-label="{entry.type} value"
                onchange={(e) => commitJson(index, e.currentTarget.value)}
              />
            {:else if spec?.value.control === "ref"}
              {@const opts = refOptions(spec.value.node, entry.value)}
              <select
                class="entry-op entry-op--value"
                aria-label="{entry.type} value"
                onchange={(e) => onupdateentry(triggerName, list, index, "value", e.currentTarget.value)}
              >
                {#each opts as o}<option value={o} selected={o === entry.value}>{o}</option>{/each}
              </select>
            {:else if spec?.value.control === "text" || (!spec && typeof entry.value === "string")}
              <input
                class="entry-field entry-field--value"
                type="text"
                value={entry.value}
                aria-label="{entry.type} value"
                onchange={(e) => onupdateentry(triggerName, list, index, "value", e.currentTarget.value)}
              />
            {/if}
          </div>

          <button
            class="entry-remove"
            aria-label="Remove {entry.type} {entryNoun}"
            onclick={() => onremoveentry(triggerName, list, index)}
          >×</button>
        </li>
      {/each}
    </ul>
  {/if}

  {#if adding}
    <div class="inspector__add-form">
      <select class="inspector__add-select" bind:value={addType}>
        {#each TYPES as t}<option value={t}>{t}</option>{/each}
      </select>
      <div class="inspector__add-actions">
        <button class="inspector__add-confirm" onclick={confirmAdd}>Add</button>
        <button class="inspector__add-cancel" onclick={() => (adding = false)}>Cancel</button>
      </div>
    </div>
  {:else}
    <button class="inspector__add-trigger" onclick={() => (adding = true)}>+ Add {entryNoun}</button>
  {/if}
</section>

<style>
  /* type tag and remove button align in fixed columns; the editable fields fill (and wrap inside) the middle column */
  .entry-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr) max-content;
    align-items: start;
    gap: 0.35rem 0.4rem;
  }

  .entry-row { display: contents; }

  .entry-tag {
    margin-top: 2px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    background: var(--color-bg-code-toolbar);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 1px 5px;
    white-space: nowrap;
  }

  .entry-fields {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
  }

  .entry-field {
    flex: 1 1 6ch;
    min-width: 0;
    box-sizing: border-box;
    padding: 1px 4px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.78rem;
  }
  .entry-field:hover { border-color: var(--color-border); }
  .entry-field:focus { outline: none; border-color: var(--color-accent); background: var(--color-bg); color: var(--color-text); }
  .entry-field--value { color: var(--color-success); }
  /* Long storage keys must stay readable in full rather than clipping beside the operator. */
  .entry-field--key { flex-basis: 100%; }

  .entry-op {
    flex: 0 1 auto;
    min-width: 0;
    max-width: 100%;
    padding: 1px 2px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text-muted);
    font-size: 0.72rem;
  }
  .entry-op--value { color: var(--color-success); }
  .entry-op:focus { outline: none; border-color: var(--color-accent); }

  .entry-prose {
    flex: 1 1 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 4px 6px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    resize: vertical;
  }
  .entry-prose:focus { outline: none; border-color: var(--color-accent); }

  .entry-bool {
    flex: 0 0 auto;
    padding: 1px 8px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: transparent;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.74rem;
    cursor: pointer;
  }
  .entry-bool--true { color: var(--color-success); border-color: color-mix(in srgb, var(--color-success), transparent 55%); }
  .entry-bool:hover { border-color: var(--color-accent); }

  .entry-remove {
    margin-top: 1px;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    line-height: 1;
    padding: 0 2px;
    cursor: pointer;
    border-radius: 3px;
  }
  .entry-remove:hover { color: var(--color-error); background: color-mix(in srgb, var(--color-error), transparent 85%); }

  .inspector__add-trigger {
    grid-column: 1 / -1;
    margin-top: 0.35rem;
    padding: 0.15rem 0.5rem;
    background: none;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    font-size: 0.78rem;
    cursor: pointer;
    justify-self: start;
  }
  .inspector__add-trigger:hover { color: var(--color-accent); border-color: var(--color-accent); }

  .inspector__add-form {
    margin-top: 0.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .inspector__add-select {
    width: 100%;
    padding: 0.2rem 0.4rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.78rem;
    box-sizing: border-box;
  }
  .inspector__add-select:focus { outline: 2px solid var(--color-accent); outline-offset: 1px; }

  .inspector__add-actions { display: flex; gap: 0.3rem; }

  .inspector__add-confirm,
  .inspector__add-cancel {
    padding: 0.15rem 0.6rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    font-size: 0.78rem;
    cursor: pointer;
  }
  .inspector__add-confirm { background: var(--color-accent); color: var(--color-on-link); border-color: var(--color-accent); }
  .inspector__add-confirm:hover { opacity: 0.85; }
  .inspector__add-cancel { background: var(--color-bg-subtle); color: var(--color-text-muted); }
  .inspector__add-cancel:hover { background: var(--color-bg-code-toolbar); }
</style>
