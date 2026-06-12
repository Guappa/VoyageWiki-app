<script lang="ts">
  import { onMount } from "svelte";

  const SIZES = [13, 16, 20, 26] as const;
  type SizeOption = (typeof SIZES)[number];
  const DEFAULT_SIZE: SizeOption = 16;
  const STORAGE_KEY = "wiki-fontsize";

  let activeSize: SizeOption = DEFAULT_SIZE;

  function readStoredSize(): SizeOption {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw === null ? NaN : parseInt(raw, 10);
      return (SIZES as readonly number[]).includes(parsed) ? (parsed as SizeOption) : DEFAULT_SIZE;
    } catch {
      return DEFAULT_SIZE;
    }
  }

  function applySize(size: SizeOption): void {
    document.documentElement.style.setProperty("--size-body", size + "px");
  }

  function persistSize(size: SizeOption): void {
    try {
      localStorage.setItem(STORAGE_KEY, String(size));
    } catch {
      /* localStorage unavailable; choice is lost on reload but UI still works */
    }
  }

  function chooseSize(size: SizeOption): void {
    activeSize = size;
    applySize(size);
    persistSize(size);
  }

  onMount(() => {
    activeSize = readStoredSize();
    applySize(activeSize);
  });
</script>

<div class="font-size-control" role="group" aria-label="Adjust text size">
  {#each SIZES as size}
    <button
      type="button"
      class="font-size-control__btn"
      class:is-active={activeSize === size}
      style="font-size: {size <= 13 ? 11 : size <= 16 ? 13 : size <= 20 ? 15 : 18}px"
      aria-label="Set text size to {size === 13 ? 'small' : size === 16 ? 'default' : size === 20 ? 'large' : 'extra large'}"
      aria-pressed={activeSize === size}
      on:click={() => chooseSize(size)}
    >
      A
    </button>
  {/each}
</div>
