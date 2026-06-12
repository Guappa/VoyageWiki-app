<script lang="ts">
  import CodeEditor from "./CodeEditor.svelte";

  interface Props {
    value: string;
    onsave: (next: string) => void;
    oncancel: () => void;
  }
  const { value, onsave, oncancel }: Props = $props();

  let draft = $state(value);
</script>

<svelte:window onkeydown={(e) => { if (e.key === "Escape") oncancel(); }} />

<!-- svelte-ignore a11y_click_events_have_key_events -- Escape closes via the window handler above -->
<div class="sm-backdrop" role="presentation" onclick={oncancel}>
  <div class="sm-panel" role="dialog" aria-modal="true" aria-label="Edit script" tabindex="-1" onclick={(e) => e.stopPropagation()}>
    <div class="sm-head">Edit script</div>
    <div class="sm-body">
      <CodeEditor doc={value} minHeight="55vh" onchange={(t) => (draft = t)} />
    </div>
    <div class="sm-actions">
      <button class="sm-btn sm-btn--cancel" onclick={oncancel}>Cancel</button>
      <button class="sm-btn sm-btn--save" onclick={() => onsave(draft)}>Save</button>
    </div>
  </div>
</div>

<style>
  .sm-backdrop {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: color-mix(in srgb, var(--color-bg), transparent 25%);
  }

  .sm-panel {
    display: flex;
    flex-direction: column;
    width: min(900px, 90vw);
    max-height: 85vh;
    background: var(--color-bg-infobox);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-card-hover);
    overflow: hidden;
  }

  .sm-head {
    padding: 0.6rem 0.9rem;
    border-bottom: 1px solid var(--color-border);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .sm-body {
    padding: 0.75rem;
    overflow: auto;
  }

  .sm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0.6rem 0.9rem;
    border-top: 1px solid var(--color-border);
  }

  .sm-btn {
    padding: 0.3rem 0.9rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    font-size: 0.85rem;
    cursor: pointer;
  }
  .sm-btn--cancel { background: var(--color-bg-subtle); color: var(--color-text-muted); }
  .sm-btn--cancel:hover { background: var(--color-bg-code-toolbar); }
  .sm-btn--save { background: var(--color-accent); color: var(--color-on-link); border-color: var(--color-accent); }
  .sm-btn--save:hover { opacity: 0.85; }
</style>
