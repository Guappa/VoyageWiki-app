import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import svelte from "@astrojs/svelte";
import sitemap from "@astrojs/sitemap";
import rehypeHighlight from "rehype-highlight";
import { rehypeCodeBlockToolbar } from "./src/plugins/code-block-toolbar.ts";
import { rehypeNoteBlockquotes } from "./src/plugins/note-blockquotes.ts";
import { rehypeTableWrap } from "./src/plugins/table-wrap.ts";
import { remarkRetagCodeAsJson } from "./src/plugins/retag-code-as-json.ts";
import { remarkSizeLimit } from "./src/plugins/remark-size-limit.ts";
import { rehypeExternalLinksBlank } from "./src/plugins/external-links-blank.ts";
import { rehypeFieldTooltip } from "./src/plugins/rehype-field-tooltip.ts";
import { rehypeValidatorLink } from "./src/plugins/rehype-validator-link.ts";

const markdownProcessor = unified({
  remarkPlugins: [remarkRetagCodeAsJson, remarkSizeLimit],
  rehypePlugins: [
    rehypeNoteBlockquotes,
    rehypeTableWrap,
    [rehypeHighlight, { detect: false, subset: false, ignoreMissing: true }],
    rehypeCodeBlockToolbar,
    rehypeExternalLinksBlank,
    rehypeFieldTooltip,
    rehypeValidatorLink
  ]
});

export default defineConfig({
  site: "https://voyagewiki.pages.dev",
  output: "static",
  integrations: [mdx(), svelte(), sitemap()],
  markdown: { syntaxHighlight: false, processor: markdownProcessor },
  trailingSlash: "never",
  compressHTML: false,
  build: { format: "directory" },
  devToolbar: { enabled: false },
  // CodeMirror is an inherently ~500 kB lazy-loaded editor island; lift the warning threshold above it rather than over-split.
  vite: { build: { chunkSizeWarningLimit: 600 } }
});