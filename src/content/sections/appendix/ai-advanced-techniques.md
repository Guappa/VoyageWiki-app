---
tab: "appendix"
section: "ai-advanced-techniques"
title: "Advanced AI Instruction Techniques"
kind: "guide"
summary: "Instruction patterns observed in authored worlds that go beyond standard custom block usage — priority overrides, conditional routing, behavior suppression, and spawn guards. These are prose instructions to an AI model. The AI interprets and applies them; compliance is high but not guaranteed."
order: 20
advanced: false
---

The patterns on this page go beyond standard `custom` block authoring. Every technique here is a **prose instruction to an AI model** — not a schema feature, not a hard engine rule. The AI reads your instruction and decides how to apply it. Compliance is generally high when instructions are clear, prominent, and specific. It is not guaranteed.

Do not design world logic that depends on these working 100% of the time. Use them where inconsistent compliance is acceptable — where following the instruction most of the time is meaningfully better than not having it, even if occasional drift occurs.

All of these belong inside `aiInstructions` task `custom` blocks (or other named keys). None require schema changes.

---

## Priority override header

Placing an explicit priority claim at the top of a `custom` block changes how the model resolves conflicts between your instructions and the engine's base task prompt:

```text
# OVERRIDE RULES — THESE TAKE PRIORITY OVER ANY CONFLICTING INSTRUCTIONS ABOVE

[Your rules follow here]
```

Without this header, the model weighs your instructions against the engine's defaults and may deprioritize them when they conflict. With it, your content is treated as the authoritative source for that task.

**When to use:** Installing a complete custom system that should replace engine defaults entirely — a full difficulty framework in `generateActionInfo`, a complete NPC intent logic in `generateNPCIntents`, a wholesale prose style in `generateStory`. Not appropriate for minor additions that should coexist with defaults.

**Reliability:** High when placed at the top of the block and written clearly. The AI reads this as an authority signal and generally honours it — but it is a prose nudge, not a hard switch. Occasional turns where the instruction is weighted less heavily will still occur.

---

## Conditional game-state routing

Tasks receive game-state context as part of their prompt. You can read fields from that context — most usefully `currentRealm` — and branch into entirely different instruction sets per value:

```text
Check currentRealm in the game state JSON. Apply the matching rules below.
These OVERRIDE all prior instructions where they conflict.

### currentRealm: "The Shadow Plane"
[Shadow Plane-specific rules...]

### currentRealm: "The Mortal World"
[Mortal World-specific rules...]

### Default
[Fallback rules for any other realm...]
```

This is particularly useful in `generateRegionDetails` and `generateLocationDetails` for worlds with multiple realms that have fundamentally different generation logic.

**When to use:** Multi-realm worlds where generation behavior needs to differ completely between realms — different geographic rules, different faction dynamics, different creature populations.

**Reliability:** The AI reads the game-state context and applies the matching branch. Works well in practice, but the AI makes a judgment call about which branch fits — it may occasionally select the wrong branch if the state field value is ambiguous or the branching conditions are too similar to each other. Keep branch conditions distinct.

---

## Behavior suppression and archetype override

You can suppress engine-provided inputs — including the location or region archetype the engine selects — with an explicit instruction:

```text
### Archetype Integration (SUPERSEDES base archetype instructions)
IGNORE the provided archetype entirely. Use these instructions as your sole creative direction instead:
[Your instructions...]
```

Or for null output:

```text
NEVER generate [X]. Return an empty [array/string].
```

The null-return pattern is useful for tasks that should produce no output under specific conditions — a faction-less realm, a region type where encounters are inappropriate, a location that shouldn't have areas generated.

**When to use:** When the engine's default input for a task (an archetype, a faction list, a context block) is actively wrong for your world or for a specific realm, and you need to replace or eliminate it rather than supplement it.

**Reliability:** Works well when the suppression instruction is near the top of the block and unambiguous. The AI interprets "IGNORE" and "NEVER generate" as strong directives — compliance is high. Occasional drift into suppressed content can still occur, particularly in long sessions where the instruction competes with strong contextual signals pushing the other way.

---

## Restricted spawn lists

In tasks that create new entities — `generateNewNPC`, `generateRegionDetails` — you can install explicit prohibition lists for types, species, or categories that should never or rarely appear:

```text
## Restricted types — do not generate without explicit justification

NEVER generate:
- [Type A] — [brief reason, e.g. unique entity; should not appear as a random encounter]
- [Type B] — [brief reason]

Conditional:
- [Type C]: Only inside or near [specific location]. Nowhere else.
```

This prevents rare or lore-significant entity types from appearing as ambient random encounters while still allowing them at authored locations.

**When to use:** Any world with creature types or NPC categories that are supposed to be rare, unique, or location-specific. Without this, the engine may generate them freely as ambient content.

**Reliability:** Strong when the list is near the top of the block, each prohibition has a brief rationale, and the prohibited types are clearly named. The AI treats NEVER as a strong directive. Occasional spawns of restricted types can still occur in contexts with very strong narrative pressure toward them — treat as a consistent suppressor, not an absolute block.

---

## Mandated opening content

In `generateInitialStart`, you can mandate a specific literal phrase or structure that must appear at the start of every new game session:

```text
ALWAYS begin with the following line spoken by the narrator, verbatim:
"[Your opening phrase here]"

Only after this line, proceed with the normal scene-setting instructions.
```

**When to use:** Worlds with a strong brand identity, a specific narrative voice that should be established immediately, or a framing device (narrator introduction, in-universe framing) that must appear before any character-specific content.

**Reliability:** The AI generally opens with the mandated phrase when the instruction is clear and the phrase is short. Longer verbatim requirements are paraphrased more often. Treat this as a strong nudge, not a script — the opening tone and content will be consistent; exact wording may drift.

---

## Minimum output depth

You can specify a minimum character count for generated content in tasks like `generateNPCDetails`:

```text
hiddenInfo for named NPCs must be at least [N] characters. Do not submit entries shorter than this.
```

Without a floor, the engine may generate minimal content when the NPC is not directly involved in the current scene context.

**When to use:** Worlds where NPC depth is a core quality bar — characters who will be encountered repeatedly and need to support extended scrutiny from the player.

**Reliability:** The AI reads the minimum and generally produces longer output as a result. It is not a hard cap — the model decides length based on available context and narrative weight, so very thin NPCs may still receive shorter entries when context pressure is high. Use this as a baseline signal, not a contract.

---

## Scaffold and variable-slot image prompts

Inside [`imagePromptConfiguration`](/ai/imagePromptConfiguration), split each category's prompt into two stacked sub-prompts: a **fixed style scaffold** identical for every generation, and a **per-instance variable list** with placeholder slots the AI fills from the subject's own data. The scaffold can be verbose since it is authored once. The slot list should be slot-shaped rather than open prose — slot-shaped placeholders give the AI a clear substitution target and produce far less drift than asking it to extract a value from a paragraph.

```text
Humanoid:
Portrait style is absolute. Generate this character in the style of prompt 1 first, then apply the per-character details from prompt 2.

1. {portraitprompt: [your global style anchors — medium, palette, lighting, shading style, line treatment, eye treatment, body framing, resolution, any world-wide attire defaults]}

2. {portraitprompt: 'GENDER', 'BODY TYPE', '8-10 APPEARANCE TAGS', 'EYE COLOR', 'HAIR COLOR AND STYLE', 'SKIN COLOR AND DETAILS', 'RACE', 'RACIAL FEATURES (ears, horns, tails, scales, wings — required for non-human races)', 'CLOTHING STYLE AND 5-10 GARMENT TAGS', 'FACTION OR HOUSE SIGIL IF APPLICABLE', 'WEAPON OR FOCUS HELD OR AT HIP'}

Prompt 1 is absolute. Prompt 2 adjusts only the per-character details inside that style. Racial features stated in the data must always be integrated correctly.

Creature / Non-humanoid:
1. {portraitprompt: [your global style anchors for creatures — same medium and palette as Humanoid; framing should specify "full creature visible, body, limbs, head, no close-ups"]}

2. {portraitprompt: 'CREATURE TYPE', 'SIZE CATEGORY', '8-10 APPEARANCE TAGS', 'EYE COLOR AND COUNT', 'BODY COVERING (fur, scales, feathers, chitin, hide, bark, stone)', 'PRIMARY COLOR', 'SECONDARY MARKINGS', 'DISTINGUISHING FEATURES (horns, wings, multiple heads, glowing parts, aura)', 'HABITAT OR ENVIRONMENT BACKGROUND', 'POSE OR TEMPERAMENT'}

Prompt 1 is absolute. Anatomy from prompt 2 must be integrated — any horns, wings, tails, scales, or other species features stated in the data must appear in the image. Full body framing is required.
```

Tailor the slot list to what your world actually has: drop racial features for grounded modern settings, add cybernetic-implant slots for sci-fi, add affinity-tell or magic-school slots for hard-magic systems. The same scaffold-plus-slots pattern works for `locations` (scaffold + per-location architectural / environmental slots) and `regions` (scaffold + per-region biome / climate / faction slots).

**When to use:** Worlds where image style consistency is a quality bar and per-subject details vary enough that authoring a custom prompt per NPC is not feasible. Most valuable when the visual identity uses distinctive style anchors (specific shading style, palette, framing rules) that the engine's default prompts otherwise drift away from.

**Reliability:** Strong when the scaffold and slot list are clearly separated and the scaffold is positive — describes what the image should be, not what it should not be. Negative-prompt tags ("no oil painting", "no 3D render") work in some image backends and not others; Voyage's behaviour with negatives is undocumented, so prefer positive style anchors and treat any negative tags as supplementary at best. The "prompt 1 is absolute" framing works as a priority signal similar to the [override header](#priority-override-header) pattern, but it remains a prose nudge — drift can still occur when per-subject details contain visual cues that contradict the scaffold.
