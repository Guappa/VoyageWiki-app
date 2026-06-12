import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { globSync } from "node:fs";
import pkg from "js-beautify";
const { html: beautifyHtml } = pkg;

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, "..", "dist");

const options = {
  indent_size: 2,
  indent_char: " ",
  max_preserve_newlines: 1,
  preserve_newlines: true,
  wrap_line_length: 0,
  end_with_newline: true,
  unformatted: ["pre", "code", "script", "style", "textarea", "astro-island", "astro-slot", "astro-static-slot"],
  content_unformatted: ["pre", "code", "script", "style", "textarea", "astro-island", "astro-slot", "astro-static-slot"],
  inline: []
};

let count = 0;
let totalDelta = 0;
for (const path of globSync(distDir + "/**/*.html")) {
  const original = readFileSync(path, "utf-8");
  const pretty = beautifyHtml(original, options);
  if (pretty !== original) {
    writeFileSync(path, pretty, "utf-8");
    totalDelta += pretty.length - original.length;
    count++;
  }
}
console.log("Beautified " + count + " HTML files, size delta " + totalDelta + " chars");
