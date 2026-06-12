---
tab: "ai"
section: "aiInstructions"
title: "Story Instructions"
kind: "schema"
summary: "`aiInstructions` is where you write the rules the narrator follows during play, organized into tasks each firing at a specific moment. This page covers the cross-task mechanics: processing logic and the two internal non-authorable tasks. Each individual task has its own page in the sidebar."
order: 100
advanced: false
uiLocation: "AI Tasks *(sidebar label: \"AI Tasks\" → task list)*"
editor: "Graphical form (labeled textareas — the only tab that is NOT a JSON editor)"
related: "narratorStyle - overarching voice persona; storySettings - world background context these tasks operate on; worldLore - lore context injected into tasks"
---

## Example

```json
{
  "aiInstructions": {
    "generateStory": {
      "Victory and Downtime": "After a win or escape — if the player is resting or celebrating, focus the turn on that. Do not seed the next problem in the same paragraph.",
      "Character Behavior": "NPCs act from consistent motivations. They know only what their position provides. They don't melt at flattery.",
      "Style Principles": "Third person, present tense. Short sentences, strong verbs. No adverbs.\n\nBanned phrases: suddenly, you realize, it seems, somehow.",
      "custom": "## World Rules\n[World-specific instructions: magic behavior, currency values, species norms, etc.]"
    },
    "generateActionInfo": {
      "custom": "## Combat System\nD&D 5e structure. Four success levels: failure, partial, success, critical."
    },
    "generateInitialStart": {
      "Opening Structure": "First beat: WHO. Second beat: WHERE. Third beat: one active situation already in progress.",
      "custom": "## World Introduction\nIntroduce proper nouns with immediate context on first use."
    }
  }
}
```

## Structure

### Markdown structure as AI priority cues

The AI reads each task's concatenated string as ordinary text but pays attention to its structural shape. A handful of patterns reliably signal priority and intent:

- **`## SECTION HEADER`** acts as a strong topical break. The model treats everything below the header as belonging together and weighted as a coherent block. Use it to separate procedure phases, scene categories, or rule families. Two-pound headers carry more weight than three-pound or four-pound.
- **`## ALL-CAPS HEADER`** signals higher priority than mixed-case. The model interprets capitalisation as emphasis. Reserve it for sections you want the AI to treat as overriding defaults (`## MANDATORY`, `## OVERRIDE`, `## STRICT RULES`).
- **Numbered or `Step N:` headers** push the model toward a procedural reading. Useful when the task requires running through phases in order (classify → filter → apply → output).
- **Inline emphasis words** — `MANDATORY`, `MUST`, `NEVER`, `OVERRIDE`, `ABSOLUTE` — function as direct priority signals when written in caps mid-sentence. Use sparingly; over-use dilutes them.
- **Labelled bullet lists** (`- TYPE: behaviour rule`) read as a lookup table the AI can apply by matching the type token to the current situation. Stronger than prose paragraphs for branching rules.
- **`Format:` directives** with quoted templates (`Format: "Background: ...\n\nPersonality: ..."`) anchor the expected output shape. The model imitates the literal example closely.
- **Negative rules** stated as `Do not X` carry weight only when they sit next to the positive rule they exclude. A standalone "do not" list at the end is read past faster than rules paired with their counterpart positive.

The processing-order rule below applies regardless of structure: keys are concatenated in declaration order. Markdown structure operates *inside* each key's string value.

> **📋 Note:** For installing a full custom system that should replace the engine's defaults rather than coexist with them, see [Priority override header](/appendix/ai-advanced-techniques#priority-override-header) in the Advanced AI Techniques appendix.

## Processing order

### Concatenation logic

Task names must match the engine's task IDs exactly (see the sidebar for the full list), and each value is a markdown-capable instruction string. A rule placed in the wrong task either fires at the wrong moment or wastes token budget on the most frequent task.

For every task with editable keys:

1. Engine loads its base instructions for the task
2. World config overrides are loaded
3. For each editable key: world override is used if present, otherwise the engine default
4. Any custom keys you add (beyond the editable defaults) are appended after defaults
5. All non-empty instructions are concatenated in key order

**Keys are case-sensitive** and must match exactly. `Style Principles` will not match `style principles`.

### Internal tasks

> **Internal tasks (not authorable):** `generateItemUpdates` (inventory changes) and `generateItemDefinitions` (newly created items) receive `ItemGenerationAndUsage` as context but are not valid keys in `aiInstructions` — using them produces a validator error.

### authorSeeds for world-wide voice consistency

**`authorSeeds` for world-wide voice consistency**

Defining a single [`authorSeeds`](/other/authorSeeds) entry with a comprehensive style guide applies it globally across all NPC and character generation without repeating instructions in every AI task. Multiple entries give you distinct registers you can slot in through traits or story starts — but a single well-written entry is enough to anchor a consistent world voice.
