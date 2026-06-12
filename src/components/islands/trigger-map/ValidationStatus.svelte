<script lang="ts">
  import type { ValidationResult } from "~/lib/validator";
  import { composeMessage } from "~/lib/validator/report";

  interface Props {
    validation: ValidationResult | null;
  }
  const { validation }: Props = $props();

  let expanded = $state(false);

  const hasErrors   = $derived(!!validation && validation.errors.length > 0);
  const hasWarnings = $derived(!!validation && validation.warnings.length > 0);

  // recommendations stay silent in the chip count; only errors+warnings expand the list
  const issues = $derived(
    validation
      ? [...validation.errors, ...validation.warnings]
      : []
  );

  function pluralize(count: number, noun: string): string {
    return `${count} ${noun}${count === 1 ? "" : "s"}`;
  }

  const chipLabel = $derived.by(() => {
    if (!validation) return "";
    if (hasErrors || hasWarnings) {
      const parts: string[] = [];
      if (hasErrors) parts.push(pluralize(validation.errors.length, "error"));
      if (hasWarnings) parts.push(pluralize(validation.warnings.length, "warning"));
      return parts.join(" · ");
    }
    const suggestions = validation.recommendations.length;
    return suggestions > 0 ? `✓ Valid · ${pluralize(suggestions, "suggestion")}` : "✓ Valid";
  });

  const chipClass = $derived(
    hasErrors ? "vs__chip--error" : hasWarnings ? "vs__chip--warning" : "vs__chip--ok"
  );
</script>

{#if validation}
  <div class="vs">
    <button
      type="button"
      class={["vs__chip", chipClass].join(" ")}
      onclick={() => { if (issues.length > 0) expanded = !expanded; }}
      aria-expanded={issues.length > 0 ? expanded : undefined}
    >
      {chipLabel}
    </button>

    {#if expanded && issues.length > 0}
      <ul class="vs__list">
        {#each issues as issue, i (i + "::" + issue.path + "::" + issue.title)}
          <li class={["vs__item", issue.severity === "error" ? "vs__item--error" : "vs__item--warning"].join(" ")}>
            <code class="vs__path">{issue.path}</code>
            <span class="vs__message">{composeMessage(issue)}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

<style>
  .vs { display: flex; flex-direction: column; gap: 0.25rem; }

  .vs__chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 500;
    border: 1px solid transparent;
    cursor: default;
    white-space: nowrap;
  }
  .vs__chip--ok      { background: color-mix(in srgb, #3fb950 15%, transparent); border-color: #3fb950; color: #3fb950; }
  .vs__chip--warning { background: color-mix(in srgb, #d29922 15%, transparent); border-color: #d29922; color: #d29922; cursor: pointer; }
  .vs__chip--error   { background: color-mix(in srgb, #ef4444 15%, transparent); border-color: #ef4444; color: #ef4444; cursor: pointer; }

  .vs__list {
    list-style: none;
    margin: 0;
    padding: 0.25rem 0;
    max-height: 220px;
    overflow-y: auto;
    border: 1px solid var(--color-border, #30363d);
    border-radius: 6px;
    background: var(--color-bg, #0d1117);
    font-size: 0.76rem;
  }
  .vs__item {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.3rem 0.6rem;
    border-left: 3px solid transparent;
  }
  .vs__item--error   { border-left-color: #ef4444; }
  .vs__item--warning { border-left-color: #d29922; }
  .vs__item + .vs__item { border-top: 1px solid var(--color-border, #30363d); }

  .vs__path { color: var(--color-text-muted, #8b949e); font-size: 0.7rem; }
  .vs__message { color: var(--color-text, #e6edf3); }
</style>
