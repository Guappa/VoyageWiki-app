<script lang="ts">
  import { onDestroy } from "svelte";
  import { voices, narrators } from "~/lib/voice-catalog-data";

  let query = $state("");
  let playingSlug = $state<string | null>(null);
  let progress = $state(0);
  let copiedSlug = $state<string | null>(null);
  const audioMap = new Map<string, HTMLAudioElement>();
  let copyResetTimer: ReturnType<typeof setTimeout> | null = null;
  let rafId: number | null = null;

  function matchesText(text: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return text.toLowerCase().includes(q);
  }

  const male         = $derived(voices.filter((v) => v.gender === "male"      && matchesText(v.tag)));
  const female       = $derived(voices.filter((v) => v.gender === "female"    && matchesText(v.tag)));
  const nonbinary    = $derived(voices.filter((v) => v.gender === "nonbinary" && matchesText(v.tag)));
  const narratorList = $derived(narrators.filter((n) => matchesText(n.name)));
  const totalShown   = $derived(male.length + female.length + nonbinary.length + narratorList.length);
  const grandTotal   = voices.length + narrators.length;

  function registerAudio(slug: string, element: HTMLAudioElement | null) {
    if (element) audioMap.set(slug, element);
    else    audioMap.delete(slug);
  }

  function stopProgressLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function startProgressLoop(slug: string) {
    stopProgressLoop();
    const tick = () => {
      const audio = audioMap.get(slug);
      if (!audio || playingSlug !== slug || audio.paused) {
        rafId = null;
        return;
      }
      if (audio.duration > 0 && Number.isFinite(audio.duration)) {
        progress = audio.currentTime / audio.duration;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  function togglePlay(slug: string) {
    const element = audioMap.get(slug);
    if (!element) return;
    if (playingSlug && playingSlug !== slug) {
      const previousAudio = audioMap.get(playingSlug);
      if (previousAudio) { previousAudio.pause(); previousAudio.currentTime = 0; }
    }
    if (element.paused) {
      element.currentTime = 0;
      progress = 0;
      void element.play();
      playingSlug = slug;
      startProgressLoop(slug);
    } else {
      element.pause();
      element.currentTime = 0;
      progress = 0;
      playingSlug = null;
      stopProgressLoop();
    }
  }

  function onAudioEnded(slug: string) {
    if (playingSlug === slug) {
      playingSlug = null;
      progress = 0;
      stopProgressLoop();
    }
  }

  async function copyTag(slug: string, tag: string) {
    try {
      await navigator.clipboard.writeText(tag);
      copiedSlug = slug;
      if (copyResetTimer) clearTimeout(copyResetTimer);
      copyResetTimer = setTimeout(() => { copiedSlug = null; }, 1200);
    } catch {
      copiedSlug = null;
    }
  }

  onDestroy(() => {
    stopProgressLoop();
    if (copyResetTimer) clearTimeout(copyResetTimer);
  });
</script>

<div class="vc">
  {#snippet voiceRow(slug: string, src: string, label: string, copyable: boolean)}
    <li
      class="vc__row"
      class:vc__row--playing={playingSlug === slug}
      style:--vc-progress={playingSlug === slug ? (progress * 100) + "%" : "0%"}
    >
      <div class="vc__tag-cell">
        <code>{label}</code>
      </div>
      <div class="vc__actions">
        <button
          type="button"
          class="vc__btn vc__btn--play"
          class:vc__btn--active={playingSlug === slug}
          aria-pressed={playingSlug === slug}
          aria-label={(playingSlug === slug ? "Pause" : "Play") + " " + label}
          onclick={() => togglePlay(slug)}
        >
          {#if playingSlug === slug}
            <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><rect x="6" y="5" width="4" height="14" fill="currentColor"></rect><rect x="14" y="5" width="4" height="14" fill="currentColor"></rect></svg>
            <span>Pause</span>
          {:else}
            <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"></path></svg>
            <span>Play</span>
          {/if}
        </button>
        {#if copyable}
          <button
            type="button"
            class="vc__btn vc__btn--copy"
            class:vc__btn--ok={copiedSlug === slug}
            aria-label={"Copy " + label}
            onclick={() => copyTag(slug, label)}
          >
            {#if copiedSlug === slug}
              <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M5 12.5l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>
              <span>Copied</span>
            {:else}
              <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"></rect><path d="M16 6V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h1" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>
              <span>Copy</span>
            {/if}
          </button>
        {/if}
      </div>
      <audio
        preload="none"
        {src}
        onloadstart={(e) => registerAudio(slug, e.currentTarget as HTMLAudioElement)}
        onended={() => onAudioEnded(slug)}
      ></audio>
    </li>
  {/snippet}

  <div class="vc__head">
    <label class="vc__search">
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"></circle>
        <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
      </svg>
      <input
        type="search"
        placeholder="Filter by voiceTag (e.g. british, gravelly, warm)"
        bind:value={query}
        autocomplete="off"
        spellcheck="false"
        aria-label="Filter voice tags"
      />
      {#if query}
        <button class="vc__clear" type="button" aria-label="Clear filter" onclick={() => (query = "")}>x</button>
      {/if}
    </label>
    <span class="vc__counts" aria-live="polite">
      <span class="vc__count vc__count--male"><span class="vc__sym">M</span> {male.length}</span>
      <span class="vc__count vc__count--female"><span class="vc__sym">F</span> {female.length}</span>
      <span class="vc__count vc__count--nb">NB {nonbinary.length}</span>
      <span class="vc__count vc__count--narr">Narr {narratorList.length}</span>
      <span class="vc__count vc__count--total">{totalShown} / {grandTotal}</span>
    </span>
  </div>

  <div class="vc__cols">
    <section class="vc__col" aria-labelledby="vc-male-heading">
      <h2 id="vc-male-heading" class="vc__heading vc__heading--male">
        <span class="vc__bar"></span>
        <span class="vc__heading-label">Male voices</span>
        <span class="vc__heading-count">{male.length}</span>
      </h2>
      {#if male.length === 0}
        <p class="vc__empty">No matches in male voices.</p>
      {:else}
        <ul class="vc__list">
          {#each male as v (v.slug)}
            {@render voiceRow(v.slug, v.src, v.tag, true)}
          {/each}
        </ul>
      {/if}
    </section>

    <div class="vc__separator" aria-hidden="true"></div>

    <section class="vc__col" aria-labelledby="vc-female-heading">
      <h2 id="vc-female-heading" class="vc__heading vc__heading--female">
        <span class="vc__bar"></span>
        <span class="vc__heading-label">Female voices</span>
        <span class="vc__heading-count">{female.length}</span>
      </h2>
      {#if female.length === 0}
        <p class="vc__empty">No matches in female voices.</p>
      {:else}
        <ul class="vc__list">
          {#each female as v (v.slug)}
            {@render voiceRow(v.slug, v.src, v.tag, true)}
          {/each}
        </ul>
      {/if}
    </section>
  </div>

  {#if nonbinary.length}
    <section class="vc__col vc__col--full" aria-labelledby="vc-nb-heading">
      <h2 id="vc-nb-heading" class="vc__heading vc__heading--nonbinary">
        <span class="vc__bar"></span>
        <span class="vc__heading-label">Nonbinary voices</span>
        <span class="vc__heading-count">{nonbinary.length}</span>
      </h2>
      <ul class="vc__list">
        {#each nonbinary as v (v.slug)}
          {@render voiceRow(v.slug, v.src, v.tag, true)}
        {/each}
      </ul>
    </section>
  {/if}

  {#if narratorList.length}
    <section class="vc__col vc__col--full" aria-labelledby="vc-narr-heading">
      <h2 id="vc-narr-heading" class="vc__heading vc__heading--narrator">
        <span class="vc__bar"></span>
        <span class="vc__heading-label">Narrator voices</span>
        <span class="vc__heading-count">{narratorList.length}</span>
      </h2>
      <p class="vc__note">Storyteller voices, selected in narrator settings — not character <code>voiceTag</code> values.</p>
      <ul class="vc__list">
        {#each narratorList as n (n.slug)}
          {@render voiceRow(n.slug, n.src, n.name, false)}
        {/each}
      </ul>
    </section>
  {/if}
</div>

<style>
  .vc {
    --vc-female: #d68fff;
    --vc-male:   #6aa3ff;
    --vc-nb:     #5ec07c;
    --vc-narr:   #f1a23e;
    --vc-row-pad-x: 1rem;
    margin: 1rem 0 0;
  }

  .vc__head {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
    padding-bottom: 0.7rem;
    border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.08));
    margin-bottom: 1.1rem;
  }
  .vc__search {
    flex: 1 1 18rem;
    min-width: 14rem;
    position: relative;
    display: flex;
    align-items: center;
    color: var(--color-text-dim, #9aa0a6);
  }
  .vc__search svg { position: absolute; left: 0.6rem; pointer-events: none; }
  .vc__search input {
    width: 100%;
    padding: 0.45rem 1.85rem 0.45rem 1.95rem;
    background: var(--color-bg-card, rgba(255,255,255,0.025));
    border: 1px solid var(--color-border, rgba(255,255,255,0.12));
    border-radius: 0.4rem;
    color: inherit;
    font: inherit;
    font-size: 0.88rem;
  }
  .vc__search input:focus {
    outline: none;
    border-color: var(--color-accent, #f1a23e);
    color: var(--color-text, inherit);
    background: transparent;
  }
  .vc__clear {
    position: absolute;
    right: 0.45rem;
    padding: 0 0.4rem;
    border: 0;
    background: transparent;
    color: var(--color-text-dim, #9aa0a6);
    cursor: pointer;
    font: inherit;
    font-size: 0.85rem;
    line-height: 1;
  }
  .vc__clear:hover { color: var(--color-text, inherit); }

  .vc__counts {
    display: inline-flex;
    gap: 0.65rem;
    font-size: 0.78rem;
    color: var(--color-text-dim, #9aa0a6);
    align-items: center;
  }
  .vc__sym {
    display: inline-block;
    width: 1.05rem;
    height: 1.05rem;
    line-height: 1.05rem;
    text-align: center;
    border-radius: 999px;
    font-size: 0.62rem;
    font-weight: 700;
    margin-right: 0.25rem;
    color: #1a1a1a;
  }
  .vc__count--female .vc__sym { background: var(--vc-female); }
  .vc__count--male   .vc__sym { background: var(--vc-male); }
  .vc__count--female { color: var(--vc-female); }
  .vc__count--male   { color: var(--vc-male); }
  .vc__count--total  { padding-left: 0.65rem; border-left: 1px solid var(--color-border, rgba(255,255,255,0.12)); }
  .vc__count--nb   { color: var(--vc-nb); }
  .vc__count--narr { color: var(--vc-narr); }

  .vc__heading--nonbinary .vc__bar { background: var(--vc-nb); }
  .vc__heading--nonbinary .vc__heading-label { color: var(--vc-nb); }
  .vc__heading--narrator .vc__bar { background: var(--vc-narr); }
  .vc__heading--narrator .vc__heading-label { color: var(--vc-narr); }

  .vc__col--full { margin-top: 1.6rem; }
  .vc__note {
    margin: -0.2rem 0 0.7rem;
    font-size: 0.8rem;
    font-style: italic;
    color: var(--color-text-dim, #9aa0a6);
  }

  /* Two-column layout with a vertical separator between */
  .vc__cols {
    display: grid;
    grid-template-columns: 1fr 1px 1fr;
    gap: 1.5rem;
    align-items: start;
  }
  .vc__separator {
    align-self: stretch;
    width: 1px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      var(--color-border-strong, rgba(255,255,255,0.22)) 12%,
      var(--color-border-strong, rgba(255,255,255,0.22)) 88%,
      transparent 100%
    );
  }

  @media (max-width: 760px) {
    .vc__cols { grid-template-columns: 1fr; gap: 1.5rem; }
    .vc__separator {
      width: auto;
      height: 1px;
      background: linear-gradient(
        to right,
        transparent 0%,
        var(--color-border-strong, rgba(255,255,255,0.22)) 12%,
        var(--color-border-strong, rgba(255,255,255,0.22)) 88%,
        transparent 100%
      );
    }
  }

  /* Section heading - subtle, with a colored leading bar */
  .vc__heading {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin: 0 0 0.7rem;
    font-size: 0.78rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-text-dim, #9aa0a6);
    font-weight: 600;
  }
  .vc__bar {
    width: 0.25rem;
    height: 1rem;
    border-radius: 0.15rem;
    flex-shrink: 0;
  }
  .vc__heading--female .vc__bar { background: var(--vc-female); }
  .vc__heading--male   .vc__bar { background: var(--vc-male); }
  .vc__heading--female .vc__heading-label { color: var(--vc-female); }
  .vc__heading--male   .vc__heading-label { color: var(--vc-male); }
  .vc__heading-count {
    font-size: 0.7rem;
    padding: 0.1rem 0.45rem;
    border: 1px solid var(--color-border, rgba(255,255,255,0.15));
    border-radius: 999px;
    letter-spacing: 0;
    text-transform: none;
    margin-left: auto;
    color: var(--color-text-dim, #9aa0a6);
  }

  /* List + per-row dividers */
  .vc__list {
    list-style: none;
    margin: 0;
    padding: 0;
    border: 1px solid var(--color-border, rgba(255,255,255,0.1));
    border-radius: 0.5rem;
    background: var(--color-bg-card, rgba(255,255,255,0.02));
    overflow: hidden;
  }
  .vc__row {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 0.85rem;
    padding: 0.6rem var(--vc-row-pad-x);
    border-top: 1px solid var(--color-border, rgba(255,255,255,0.07));
    transition: background 0.1s;
    min-width: 0;
    overflow: hidden;
    isolation: isolate; /* contain the animated ::before so z-index is respected */
  }
  .vc__row:first-child { border-top: 0; }
  .vc__row:hover { background: var(--color-bg-elev, rgba(255,255,255,0.035)); }
  .vc__row--playing {
    background: var(--color-accent-soft, rgba(241,162,62,0.10));
    box-shadow: inset 3px 0 0 var(--color-accent, #f1a23e);
  }

  /* Animated progress fill (visible only on the playing row) */
  .vc__row::before {
    content: "";
    position: absolute;
    top: 0; bottom: 0; left: 0;
    width: var(--vc-progress, 0%);
    background-image: repeating-linear-gradient(
      45deg,
      rgba(241, 162, 62, 0.26) 0px,
      rgba(241, 162, 62, 0.26) 6px,
      rgba(241, 162, 62, 0.06) 6px,
      rgba(241, 162, 62, 0.06) 12px
    );
    background-size: 17px 17px;
    pointer-events: none;
    z-index: 0;
    opacity: 0;
  }
  .vc__row--playing::before {
    opacity: 1;
    animation: vc-stripe 1.4s linear infinite;
  }

  @keyframes vc-stripe {
    from { background-position: 0 0; }
    to   { background-position: 17px 0; }
  }

  /* Content above the progress overlay */
  .vc__tag-cell, .vc__actions {
    position: relative;
    z-index: 1;
    min-width: 0;
  }

  .vc__tag-cell {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  /* translateZ(0) forces a compositor layer so the chip sits above the animated stripe overlay instead of under it. */
  .vc__tag-cell code {
    display: inline-block;
    background-color: var(--color-bg-subtle, #252525) !important;
    background-image: none !important;
    border: 1px solid var(--color-border, rgba(255,255,255,0.12));
    border-radius: var(--radius-sm, 3px);
    padding: 3px 8px;
    position: relative;
    z-index: 3;
    transform: translateZ(0);
  }
  /* Neutral border on the playing row; an accent border merges with the stripe overlay into a "stripes pass through" illusion. */
  .vc__actions {
    display: inline-flex;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .vc__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.6rem;
    background-color: var(--color-bg-subtle, #252525);
    border: 1px solid var(--color-border, rgba(255,255,255,0.12));
    border-radius: 0.35rem;
    color: var(--color-text-dim, #9aa0a6);
    cursor: pointer;
    font: inherit;
    font-size: 0.74rem;
    line-height: 1;
    transition: background 0.1s, border-color 0.1s, color 0.1s;
    white-space: nowrap;
    position: relative;
    z-index: 3;
    transform: translateZ(0);
  }
  .vc__btn:hover {
    border-color: var(--color-border-strong, rgba(255,255,255,0.22));
    color: var(--color-text, inherit);
  }
  .vc__btn:focus-visible {
    outline: 2px solid var(--color-accent, #f1a23e);
    outline-offset: 1px;
  }
  .vc__btn--active {
    background: color-mix(in srgb, var(--color-accent, #f1a23e) 20%, var(--color-bg-subtle, #252525));
    border-color: var(--color-accent, #f1a23e);
    color: var(--color-accent, #f1a23e);
  }
  .vc__btn--ok {
    background: color-mix(in srgb, #5ec07c 20%, var(--color-bg-subtle, #252525));
    border-color: rgba(94,192,124,0.55);
    color: #5ec07c;
  }

  .vc__empty {
    margin: 0;
    padding: 0.85rem 1rem;
    font-size: 0.85rem;
    color: var(--color-text-dim, #9aa0a6);
    font-style: italic;
    border: 1px dashed var(--color-border, rgba(255,255,255,0.12));
    border-radius: 0.5rem;
  }

  @media (max-width: 420px) {
    .vc__row { grid-template-columns: 1fr; row-gap: 0.4rem; }
    .vc__actions { justify-content: flex-end; }
  }

  @media (prefers-reduced-motion: reduce) {
    .vc__row--playing::before { animation: none; }
  }
</style>