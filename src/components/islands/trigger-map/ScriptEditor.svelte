<script lang="ts">
  import CodeEditor from "./CodeEditor.svelte";
  import ScriptModal from "./ScriptModal.svelte";

  interface Props {
    value: string;
    onsave: (next: string) => void;
  }
  const { value, onsave }: Props = $props();

  let expanded = $state(false);
  // Bumped after a popout save so the inline editor remounts and picks up the new value.
  let version = $state(0);

  function saveFromModal(next: string) {
    onsave(next);
    expanded = false;
    version += 1;
  }
</script>

<div class="script-editor">
  <button
    class="script-editor__expand"
    type="button"
    title="Expand editor"
    aria-label="Expand script editor"
    onclick={() => (expanded = true)}
  >
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
  </button>
  {#key version}
    <CodeEditor doc={value} onblur={onsave} />
  {/key}
</div>

{#if expanded}
  <ScriptModal {value} onsave={saveFromModal} oncancel={() => (expanded = false)} />
{/if}

<style>
  .script-editor {
    position: relative;
    margin-top: 0.5rem;
  }

  .script-editor__expand {
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg-subtle);
    color: var(--color-text-muted);
    cursor: pointer;
  }
  .script-editor__expand:hover { color: var(--color-accent); border-color: var(--color-accent); }
</style>
