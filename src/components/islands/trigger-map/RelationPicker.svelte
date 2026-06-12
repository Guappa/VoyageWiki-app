<script lang="ts">
  import type { RelationChoice } from "~/lib/trigger-map/authoring";

  interface Props {
    choices: RelationChoice[];
    x: number;
    y: number;
    onpick: (choice: RelationChoice) => void;
    oncancel: () => void;
  }
  const { choices, x, y, onpick, oncancel }: Props = $props();

  // Human-readable labels so authors see intent rather than type strings.
  const LABELS: Record<RelationChoice, string> = {
    "quest-init":             "Start quest (effect)",
    "party-location":         "Require location (condition)",
    "player-traits":          "Require trait (condition)",
    "known-entity-effect":    "Reveal entity (effect)",
    "known-entity-condition": "Know entity (condition)",
    "read-boolean":           "Read flag (condition)",
    "read-number":            "Read number (condition)",
    "write-boolean":          "Set flag (effect)",
    "write-number":           "Set number (effect)",
  };

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") oncancel();
  }

  // Focus the menu container on mount so blur/escape cancel work immediately.
  function attachFocus(node: HTMLElement) {
    node.focus();
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
  class="relation-picker"
  style="left:{x}px; top:{y}px"
  use:attachFocus
  tabindex="-1"
  onblur={oncancel}
  role="menu"
  aria-label="Choose connection type"
>
  {#each choices as choice (choice)}
    <button
      class="relation-picker__option"
      role="menuitem"
      onmousedown={(e) => { e.stopPropagation(); onpick(choice); }}
    >
      {LABELS[choice]}
    </button>
  {/each}
</div>

<style>
  .relation-picker {
    position: absolute;
    z-index: 1000;
    background: var(--color-bg-card, #161b22);
    border: 1px solid var(--color-border, #30363d);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    min-width: 200px;
    outline: none;
    overflow: hidden;
  }

  .relation-picker__option {
    padding: 0.45rem 0.85rem;
    background: transparent;
    border: none;
    color: var(--color-text, #e6edf3);
    font-size: 0.82rem;
    text-align: left;
    cursor: pointer;
  }

  .relation-picker__option:hover {
    background: var(--color-bg-code-toolbar, #1c2128);
    color: #79b8ff;
  }
</style>
