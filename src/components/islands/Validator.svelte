<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { placeholder as cmPlaceholder } from "@codemirror/view";
  import { EditorState, Compartment } from "@codemirror/state";
  import { json } from "@codemirror/lang-json";
  import { HighlightStyle, syntaxHighlighting, foldEffect } from "@codemirror/language";
  import { tags as t } from "@lezer/highlight";
  import { validateWorld } from "~/lib/validator";
  import type { Issue, ValidationResult } from "~/lib/validator";
  import { getDocsUrl } from "~/lib/validator/docs-links";
  import { bucketize, generateMarkdownReport, type Bucket } from "~/lib/validator/report";

  const wikiHighlightDark = HighlightStyle.define([
    { tag: t.propertyName, color: "#9CDCFE" },
    { tag: t.string, color: "#B5C677" },
    { tag: t.number, color: "#B5CEA8" },
    { tag: t.bool, color: "#569CD6" },
    { tag: t.null, color: "#569CD6" },
    { tag: t.keyword, color: "#569CD6" },
    { tag: [t.punctuation, t.brace, t.bracket, t.separator], color: "#D4D4D4" }
  ]);
  const wikiHighlightLight = HighlightStyle.define([
    { tag: t.propertyName, color: "#001080" },
    { tag: t.string, color: "#5C6E1F" },
    { tag: t.number, color: "#098658" },
    { tag: t.bool, color: "#AF00DB" },
    { tag: t.null, color: "#AF00DB" },
    { tag: t.keyword, color: "#AF00DB" },
    { tag: [t.punctuation, t.brace, t.bracket, t.separator], color: "#24292E" }
  ]);

  function currentTheme(): "light" | "dark" {
    if (typeof document === "undefined") return "dark";
    const themeAttribute = document.documentElement.getAttribute("data-theme");
    return themeAttribute === "light" ? "light" : "dark";
  }

  let input = $state("");
  let result = $state<ValidationResult | null>(null);
  let parseError = $state<string | null>(null);
  let sampleStatus = $state<"idle" | "loading" | "loaded">("idle");

  let exportErrors = $state(true);
  let exportWarnings = $state(false);
  let exportRecommendations = $state(false);
  let copyStatus = $state<"" | "copied" | "failed">("");

  let editorHost: HTMLDivElement;
  let view: EditorView | null = null;
  const highlightCompartment = new Compartment();

  function resetResults(): void {
    result = null;
    parseError = null;
  }

  function foldAllWhenReady(): void {
    if (!view) return;
    // Text-scan for foldable blocks rather than a syntax tree, so it works at any document size.
    requestAnimationFrame(() => {
      if (!view) return;
      const text = view.state.doc.toString();
      const effects: ReturnType<typeof foldEffect.of>[] = [];
      const stack: { pos: number; depth: number }[] = [];
      let i = 0;
      while (i < text.length) {
        const ch = text[i];
        if (ch === '"') {
          // Skip string contents so braces inside strings are ignored.
          i++;
          while (i < text.length) {
            if (text[i] === '\\') i += 2;
            else if (text[i] === '"') { i++; break; }
            else i++;
          }
          continue;
        }
        if (ch === '{' || ch === '[') {
          stack.push({ pos: i, depth: stack.length });
        } else if ((ch === '}' || ch === ']') && stack.length > 0) {
          const { pos: open, depth } = stack.pop()!;
          // Fold nested blocks (depth > 0) — leave the root object open.
          if (depth > 0 && text.indexOf('\n', open) < i) {
            effects.push(foldEffect.of({ from: open + 1, to: i }));
          }
        }
        i++;
      }
      if (effects.length > 0) view.dispatch({ effects, scrollIntoView: false });
    });
  }

  function setEditorContent(text: string, autoFold = false): void {
    if (view) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
      if (autoFold && text.trim()) foldAllWhenReady();
    }
    input = text;
  }

  function runValidate(): void {
    resetResults();
    // Read from view.state.doc directly; CodeMirror's updateListener fires outside Svelte's tracked flow, leaving `input` stale on paste.
    const text = view ? view.state.doc.toString() : input;
    if (!text.trim()) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parseError = (e as Error).message;
      return;
    }
    result = validateWorld(parsed);
  }

  async function loadSample(): Promise<void> {
    sampleStatus = "loading";
    resetResults();
    try {
      const response = await fetch("/downloads/default-world.json");
      if (!response.ok) throw new Error("HTTP " + response.status);
      setEditorContent(await response.text(), true);
      sampleStatus = "loaded";
    } catch (e) {
      parseError = "Could not load minimal sample: " + (e as Error).message;
      sampleStatus = "idle";
    }
  }

  function clearInput(): void {
    setEditorContent("");
    resetResults();
    sampleStatus = "idle";
  }

  let fileInput: HTMLInputElement;

  function triggerFilePicker(): void {
    fileInput?.click();
  }

  async function handleFileSelected(e: Event): Promise<void> {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    resetResults();
    try {
      // Some editors save JSON with a UTF-8 BOM, which breaks JSON.parse.
      const text = (await file.text()).replace(/^﻿/, "");
      setEditorContent(text, true);
      // Wait a tick so the CodeMirror dispatch settles before runValidate reads the doc.
      await Promise.resolve();
      runValidate();
    } catch (err) {
      parseError = "Could not read file: " + (err as Error).message;
    }
    // Reset so picking the same file again still fires change.
    target.value = "";
  }

  onMount(() => {
    if (typeof window === "undefined" || !editorHost) return;
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) input = update.state.doc.toString();
    });
    view = new EditorView({
      state: EditorState.create({
        doc: input,
        extensions: [
          basicSetup,
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ "aria-label": "World JSON editor" }),
          cmPlaceholder("Paste a world JSON, or click Upload JSON to load from a file. Runs the full V33 validator in your browser (errors, warnings, and best-practice recommendations) - the same engine as the /api/validate endpoint."),
          json(),
          highlightCompartment.of(syntaxHighlighting(currentTheme() === "dark" ? wikiHighlightDark : wikiHighlightLight)),
          updateListener,
          EditorView.theme({
            "&": { fontSize: "0.88rem", height: "100%" },
            ".cm-scroller": { minHeight: "260px" },
            ".cm-content": { fontFamily: "var(--font-mono)", padding: "12px", minHeight: "260px" },
            ".cm-gutters": { background: "var(--color-bg-code-toolbar)", border: "none", minHeight: "260px" },
            ".cm-focused": { outline: "none" },
            ".cm-placeholder": { color: "var(--color-text-muted)" }
          })
        ]
      }),
      parent: editorHost
    });

    editorHost.addEventListener("paste", () => { foldAllWhenReady(); });

    const themeObserver = new MutationObserver(() => {
      if (!view) return;
      view.dispatch({
        effects: highlightCompartment.reconfigure(
          syntaxHighlighting(currentTheme() === "dark" ? wikiHighlightDark : wikiHighlightLight)
        )
      });
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  });

  onDestroy(() => {
    if (view) { view.destroy(); view = null; }
  });

  const errorCount = $derived(result ? result.errors.length : 0);
  const warningCount = $derived(result ? result.warnings.length : 0);
  const recCount = $derived(result ? result.recommendations.length : 0);
  const totalCount = $derived(errorCount + warningCount + recCount);

  // Singletons and pairs stay inline; 3+ same-pattern entries collapse into one expandable group.
  const errorBuckets = $derived(result ? bucketize(result.errors) : []);
  const warningBuckets = $derived(result ? bucketize(result.warnings) : []);
  const recBuckets = $derived(result ? bucketize(result.recommendations) : []);


  // Backticks → <code> chips; \n → <br> so structural payloads (Affected:, Safe to ignore:) sit on their own row.
  function renderInline(text: string): string {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }


  async function copyReport(): Promise<void> {
    if (!result) return;
    const markdown = generateMarkdownReport(result, {
      errors:          exportErrors,
      warnings:        exportWarnings,
      recommendations: exportRecommendations,
    });
    try {
      await navigator.clipboard.writeText(markdown);
      copyStatus = "copied";
    } catch {
      copyStatus = "failed";
    }
    setTimeout(() => { copyStatus = ""; }, 1800);
  }
</script>

<div class="validator">
  <div class="validator__actions">
    <button type="button" class="validator__btn validator__btn--primary" onclick={runValidate}>Validate</button>
    <button type="button" class="validator__btn" onclick={triggerFilePicker}>Upload JSON</button>
    <input type="file" accept=".json,application/json,text/plain" bind:this={fileInput} onchange={handleFileSelected} style="display: none" />
    <button type="button" class="validator__btn" onclick={loadSample} disabled={sampleStatus === "loading"}>
      {sampleStatus === "loading" ? "Loading..." : "Load Voyage default world"}
    </button>
    <button type="button" class="validator__btn" onclick={clearInput} disabled={!input}>Clear</button>
  </div>

  <div class="validator__editor-wrap" bind:this={editorHost} onclick={(e) => { if (view && e.target === e.currentTarget) { view.focus(); const end = view.state.doc.length; view.dispatch({ selection: { anchor: end } }); } }}></div>

  <div class="validator__scope-note">
    <strong>Heads up:</strong> this validator is more thorough than the Voyage editor. We check cross-references, enum validity, runtime engine constraints, and authoring best practices. A world that saves cleanly in the Voyage editor can still surface issues here that affect gameplay at runtime.
  </div>

  {#if parseError}
    <div class="validator__panel validator__panel--error">
      <strong>JSON parse error:</strong> {parseError}
    </div>
  {:else if result && totalCount === 0}
    <div class="validator__panel validator__panel--ok">
      <span class="validator__panel-icon" aria-hidden="true">✅</span>
      <strong>No errors, warnings, or recommendations.</strong>
    </div>
  {:else if result}
    <div class="validator__summary">
      <span class="validator__chip validator__chip--error">{errorCount} error{errorCount === 1 ? "" : "s"}</span>
      <span class="validator__chip validator__chip--warning">{warningCount} warning{warningCount === 1 ? "" : "s"}</span>
      <span class="validator__chip validator__chip--rec">{recCount} recommendation{recCount === 1 ? "" : "s"}</span>
    </div>
    <div class="validator__export">
      <span class="validator__export-label">Copy report for AI agent:</span>
      <label class="validator__export-toggle"><input type="checkbox" bind:checked={exportErrors} /> Errors</label>
      <label class="validator__export-toggle"><input type="checkbox" bind:checked={exportWarnings} /> Warnings</label>
      <label class="validator__export-toggle"><input type="checkbox" bind:checked={exportRecommendations} /> Recommendations</label>
      <button type="button" class="validator__btn validator__btn--primary validator__export-btn" onclick={copyReport} disabled={!exportErrors && !exportWarnings && !exportRecommendations}>
        {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy as Markdown"}
      </button>
    </div>
    {#snippet docsLink(path: string)}
      {#if getDocsUrl(path)}
        <a class="vissue__docs" href={getDocsUrl(path)} target="_blank" rel="noopener noreferrer" title="Open authoring guidance in a new tab">docs &rarr;</a>
      {/if}
    {/snippet}
    {#snippet actionLine(severity: "error" | "warning" | "rec", fix: string)}
      {#if fix}
        <p class="vissue__action">
          <span class="vissue__label">{severity === "rec" ? "Suggestion" : "Fix"}</span>
          <span class="vissue__fix">{@html renderInline(fix)}</span>
        </p>
      {/if}
    {/snippet}
    {#snippet bucketList(buckets: Bucket[], severity: "error" | "warning" | "rec")}
      <ul class="vissues">
        {#each buckets as bucket, i (i)}
          {#if bucket.kind === "single"}
            <li class={"vissue vissue--" + severity}>
              {@render docsLink(bucket.issue.path)}
              <code class="vissue__path">{bucket.issue.path}</code>
              <p class="vissue__title">
                {@html renderInline(bucket.issue.title)}{#if bucket.issue.value}<code class="vissue__value">{bucket.issue.value}</code>{/if}
              </p>
              {#if bucket.issue.detail}<p class="vissue__detail">{@html renderInline(bucket.issue.detail)}</p>{/if}
              {@render actionLine(severity, bucket.issue.fix)}
            </li>
          {:else}
            <li class={"vissue vissue--" + severity + " vissue--group"}>
              {@render docsLink(bucket.entries[0].path)}
              <details>
                <summary class="vissue__summary">
                  <span class="vissue__count">{bucket.entries.length} &times;</span>
                  <span class="vissue__title">{@html renderInline(bucket.title)}</span>
                </summary>
                {#if bucket.detail}<p class="vissue__detail">{@html renderInline(bucket.detail)}</p>{/if}
                {@render actionLine(severity, bucket.fix)}
                <ul class="vissue__entries">
                  {#each bucket.entries as entry, j (entry.path + "::" + j)}
                    <li class="vissue__entry">
                      <code class="vissue__path">{entry.path}</code>
                      {#if entry.value}<code class="vissue__value">{entry.value}</code>{/if}
                    </li>
                  {/each}
                </ul>
              </details>
            </li>
          {/if}
        {/each}
      </ul>
    {/snippet}
    {#if result.errors.length > 0}
      <details class="validator__section validator__section--error">
        <summary class="validator__section-header">
          <h3 class="validator__section-title validator__section-title--error">Errors ({result.errors.length})</h3>
          <p class="validator__section-desc">Runtime-affecting issues &mdash; broken references, invalid enums, codec shape violations. The Voyage editor publishes worlds with these intact; the engine then silently drops fields, breaks lookups, or misfires during play. Fix for correct gameplay, not for publishing.</p>
        </summary>
        {@render bucketList(errorBuckets, "error")}
      </details>
    {/if}
    {#if result.warnings.length > 0}
      <details class="validator__section validator__section--warning">
        <summary class="validator__section-header">
          <h3 class="validator__section-title validator__section-title--warning">Warnings ({result.warnings.length})</h3>
          <p class="validator__section-desc">Quality issues that don&rsquo;t block publishing but may degrade what the AI can do with the world &mdash; empty narrative-flavor fields, layout warnings, one-way paths, and similar. Safe to ignore when the flagged behavior is intentional design.</p>
        </summary>
        {@render bucketList(warningBuckets, "warning")}
      </details>
    {/if}
    {#if result.recommendations.length > 0}
      <details class="validator__section validator__section--rec">
        <summary class="validator__section-header">
          <h3 class="validator__section-title validator__section-title--rec">Recommendations ({result.recommendations.length})</h3>
          <p class="validator__section-desc">Best-practice suggestions worth considering &mdash; sparse regions, trigger structure, missing voice tags, and similar polish items. Safe to ignore when the flagged choice is a deliberate design decision.</p>
        </summary>
        {@render bucketList(recBuckets, "rec")}
      </details>
    {/if}
  {/if}
</div>
