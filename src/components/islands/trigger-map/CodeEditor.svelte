<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { EditorState, Compartment } from "@codemirror/state";
  import { javascript } from "@codemirror/lang-javascript";
  import { syntaxHighlighting } from "@codemirror/language";
  import { currentTheme, highlightStyleFor } from "~/lib/trigger-map/codemirror-setup";

  interface Props {
    doc: string;
    minHeight?: string;
    onblur?: (next: string) => void;
    onchange?: (next: string) => void;
  }
  const { doc, minHeight = "120px", onblur, onchange }: Props = $props();

  let host: HTMLDivElement;
  let view: EditorView | null = null;
  const highlight = new Compartment();
  let themeObserver: MutationObserver | null = null;

  onMount(() => {
    if (typeof window === "undefined" || !host) return;
    view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: [
          basicSetup,
          EditorView.lineWrapping,
          javascript(),
          highlight.of(syntaxHighlighting(highlightStyleFor(currentTheme()))),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onchange?.(u.state.doc.toString());
          }),
          // Commit on blur so the model updates once, not per keystroke.
          EditorView.domEventHandlers({
            blur() {
              if (view) onblur?.(view.state.doc.toString());
            },
          }),
          EditorView.theme({
            "&": { fontSize: "0.85rem" },
            ".cm-content": { fontFamily: "var(--font-mono)", padding: "8px", minHeight },
            ".cm-gutters": { background: "var(--color-bg-code-toolbar)", border: "none" },
            ".cm-focused": { outline: "none" },
          }),
        ],
      }),
      parent: host,
    });

    themeObserver = new MutationObserver(() => {
      view?.dispatch({ effects: highlight.reconfigure(syntaxHighlighting(highlightStyleFor(currentTheme()))) });
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  });

  onDestroy(() => {
    themeObserver?.disconnect();
    if (view) { view.destroy(); view = null; }
  });
</script>

<div class="code-editor" bind:this={host}></div>

<style>
  .code-editor {
    border: 1px solid var(--color-border, #30363d);
    border-radius: 6px;
    overflow: hidden;
  }
</style>
