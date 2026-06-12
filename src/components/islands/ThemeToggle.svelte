<script lang="ts">
  import { onMount } from "svelte";
  import {
    type ResolvedTheme,
    persistThemeChoice,
    readThemeChoice,
    detectSystemPreference,
    applyTheme
  } from "~/lib/theme";

  let theme: ResolvedTheme = "dark";

  onMount(() => {
    const stored = readThemeChoice();
    theme = stored === "system" ? detectSystemPreference() : stored;
    applyTheme(theme);
  });

  function toggle(): void {
    theme = theme === "dark" ? "light" : "dark";
    persistThemeChoice(theme);
    applyTheme(theme);
  }
</script>

<button
  type="button"
  class="theme-toggle"
  aria-label={"Switch to " + (theme === "dark" ? "light" : "dark") + " theme"}
  on:click={toggle}
>
  {#if theme === "dark"}
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
  {:else}
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
    </svg>
  {/if}
</button>

<style>
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: transparent;
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
    cursor: pointer;
  }
  .theme-toggle:hover { background: var(--color-bg-subtle); }
  .theme-toggle:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }
</style>
