import { defineCollection } from "astro:content";
import { z } from "zod";
import { glob } from "astro/loaders";

const sections = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/sections" }),
  schema: z.object({
    tab: z.enum(["world", "mechanics", "ai", "other", "appendix", "getting-started", "mods"]),
    section: z.string(),
    title: z.string(),
    kind: z.enum(["schema", "guide"]).default("schema"),
    summary: z.string(),
    order: z.number().default(100),
    advanced: z.boolean().default(false),
    applyRules: z.array(z.string()).default([]),
    summaryManual: z.boolean().default(false),
    uiLocation: z.string().optional(),
    uiSubtitle: z.string().optional(),
    uiSectionTitle: z.string().optional(),
    editor: z.string().optional(),
    sizeLimits: z.string().optional(),
    related: z.string().optional()
  })
});

export const collections = { sections };
