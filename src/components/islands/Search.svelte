<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  let query = $state("");
  let shortcutLabel = $state("Ctrl K");
  let results = $state<Array<{ id: string; data: Promise<any> }>>([]);
  let resolved = $state<Array<{ url: string; meta: { title?: string }; excerpt: string } | null>>([]);
  let isOpen = $state(false);
  let pagefind: any = null;
  let inputEl: HTMLInputElement;
  let activeIndex = $state(-1);

  function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (target.isContentEditable) return true;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    return false;
  }

  function onGlobalKey(event: KeyboardEvent) {
    const isK = event.key === "k" || event.key === "K";
    if ((event.metaKey || event.ctrlKey) && isK) {
      event.preventDefault();
      inputEl?.focus();
      inputEl?.select();
      isOpen = true;
      return;
    }
    if (event.key === "/" && !isEditableTarget(event.target)) {
      event.preventDefault();
      inputEl?.focus();
      isOpen = true;
    }
  }

  onMount(() => {
    if (typeof window === "undefined") return;
    if (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "")) {
      shortcutLabel = "⌘ K";
    }
    window.addEventListener("keydown", onGlobalKey);
  });

  onDestroy(() => {
    if (typeof window === "undefined") return;
    window.removeEventListener("keydown", onGlobalKey);
  });

  async function ensurePagefind() {
    if (pagefind) return pagefind;
    try {
      const importPath = "/pagefind/pagefind.js";
      const dynamicImport = new Function("p", "return import(p)");
      pagefind = await dynamicImport(importPath);
      await pagefind.options({ excerptLength: 30 });
    } catch (e) {
      console.warn("Pagefind index not built yet. Run npm run build to generate /pagefind/");
      return null;
    }
    return pagefind;
  }

  async function runSearch() {
    const pf = await ensurePagefind();
    if (!pf) { results = []; resolved = []; return; }
    if (!query.trim()) { results = []; resolved = []; return; }
    const search = await pf.search(query);
    results = search.results.slice(0, 8);
    resolved = await Promise.all(results.map((r: any) => r.data()));
    activeIndex = resolved.length > 0 ? 0 : -1;
  }

  function onInput(value: string) {
    query = value;
    isOpen = true;
    runSearch();
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") { isOpen = false; inputEl?.blur(); return; }
    if (event.key === "ArrowDown") { event.preventDefault(); activeIndex = Math.min(activeIndex + 1, resolved.length - 1); return; }
    if (event.key === "ArrowUp") { event.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); return; }
    if (event.key === "Enter" && activeIndex >= 0 && resolved[activeIndex]) {
      const target = resolved[activeIndex];
      if (target) window.location.assign(target.url);
    }
  }

  function onBlur() {
    setTimeout(() => { isOpen = false; }, 120);
  }
</script>

<div class="search">
  <div class="search__inputwrap">
    <input
      bind:this={inputEl}
      type="search"
      id="wiki-search"
      name="q"
      autocomplete="off"
      class="search__input"
      placeholder="Search wiki..."
      aria-label="Search wiki"
      value={query}
      oninput={(e) => onInput((e.currentTarget as HTMLInputElement).value)}
      onfocus={() => { isOpen = true; }}
      onblur={onBlur}
      onkeydown={onKeydown}
    />
    <kbd class="search__shortcut" aria-hidden="true">{shortcutLabel}</kbd>
  </div>
  {#if isOpen && resolved.length > 0}
    <ul class="search__results" role="listbox">
      {#each resolved as result, index}
        {#if result}
          <li
            class={"search__result" + (index === activeIndex ? " search__result--active" : "")}
            role="option"
            aria-selected={index === activeIndex}
          >
            <a href={result.url}>
              <span class="search__result-title">{result.meta.title ?? result.url}</span>
              <span class="search__result-excerpt">{@html result.excerpt}</span>
            </a>
          </li>
        {/if}
      {/each}
    </ul>
  {:else if isOpen && query.trim()}
    <div class="search__empty">No matches.</div>
  {/if}
</div>
