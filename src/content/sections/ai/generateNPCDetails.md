---
tab: "ai"
section: "generateNPCDetails"
title: "NPC Details"
kind: "schema"
summary: "Fires once when an AI-created NPC first appears in scene with only minimal first-pass data. Generates the full basicInfo, hiddenInfo, personality, and `abilities` record. Distinct from `generateCharacterBackground`, which is on-demand biographical lore."
order: 140
advanced: false
uiLocation: "AI Tasks → NPC Details"
uiSubtitle: "\"NPC Details Instructions\""
editor: "Graphical form (labeled textareas)"
related: "generateCharacterBackground - on-demand biographical history (different trigger); generateNewNPC - first-pass NPC creation; npcs - the record this task populates"
---

## Schema

```json
{
  "aiInstructions": {
    "generateNPCDetails": {
      "custom": "string"
    }
  }
}
```


## Example

A worked pattern with labelled `hiddenInfo` sections — replace world-specific tokens:

```json
{
  "aiInstructions": {
    "generateNPCDetails": {
      "custom": "## HIDDEN INFO STRUCTURE\nAll NPCs are SENTIENT. Write hiddenInfo as three labelled fields in dense behavioural prose. Use this exact format:\n\nFormat: \"hiddenInfo\": \"Background: ...\\n\\nPersonality: ...\\n\\nCombat: ...\"\n\nBackground (6-8 sentences): Name, age, origin/clan, rank or skill tier; how they reached their current level; at least one defined relationship; current objective or pressure; personal view on their role or world.\n\nPersonality (7-9 sentences): Speech style and tone; default behaviour and how it shifts under pressure; routine and idle tendencies; behaviour toward higher vs lower status; what they hide vs reveal; one defining belief or trait outside combat.\n\nCombat (4-5 sentences): Fighting style tied to their training and specialisation; preferred range and engagement style; triggers for escalation or disengagement; reaction to injury or disadvantage; one distinct combat habit.\n\n## ABILITIES (MANDATORY)\nAll NPCs must have 6-10 abilities. Abilities must be broad systems, not single techniques; must reflect rank and specialisation; must explain practical combat or utility use.\nFormat: (TYPE) Ability Name: Description. Types: attack, combat, utility.\n\n## ARCHETYPE FIRST\nNPCs must be immediately readable on first encounter. Each rank or class should carry a one-line silhouette: 'reactive, learning' / 'composed, dependable' / 'commanding, experienced' / 'silent, efficient, lethal' / 'authoritative, dominant'. Match observable behaviour to the silhouette.\n\n## CHARACTER PHILOSOPHY\nDefine characters by what they want — ambitions, loyalties, drives — not by what they have lost. Lead with desire, not damage.\n\n## KNOWLEDGE LIMITS\nNPCs volunteer only what their role and position would plausibly allow. Hidden information surfaces through play, observation, or earned trust — never through narrator convenience.\n\n## BANNED TYPES\nNo bureaucrats, pedants, worriers, sticklers, moralists, or procedural personalities. Any record-keeper should be dangerous or funny, not procedural."
    }
  }
}
```


## Fields

### custom

The only key — free-form rules for the full first-pass fill-in (`basicInfo`, `hiddenInfo`, personality, `abilities`).

> **📋 Note:** `generateNPCDetails` runs on AI-improvised, authored, and quest-spawned NPCs alike, on each NPC's first meaningful appearance — not only AI-created ones.

## Authoring pattern

- **Labelled `hiddenInfo` sections with explicit sentence counts.** Telling the model `Background (6-8 sentences) / Personality (7-9 sentences) / Combat (4-5 sentences)` produces consistent depth across all generated NPCs. The labels themselves anchor the model's output structure.
- **`Format:` directive with literal escaped newlines.** Showing the exact intended output string — `"Background: ...\n\nPersonality: ...\n\nCombat: ..."` — pins the model to the format rather than asking it to infer.
- **Mandatory abilities count + format spec.** `6-10 abilities` plus `Format: (TYPE) Name: Description` plus the enum of types prevents the model from producing one-line ability strings or skipping the count.
- **Archetype-first design.** A one-line silhouette per rank/class makes generated NPCs immediately readable on first encounter. The model uses the silhouette as the seed and fills outward.
- **Character philosophy and knowledge limits as cross-cutting rules.** These apply regardless of which archetype the NPC falls into. Keep them short and prescriptive — `Lead with desire, not damage` is more useful than three paragraphs about motivation theory.
- **Banned-types list to suppress default tropes.** Without an explicit ban the model defaults toward procedural, anxious, or worry-coded characters. Naming what NOT to produce is more effective than describing what TO produce.

**How personality manifests physically:** posture, speech patterns, how the character moves. "Confident" is a label; "speaks over the ends of other people's sentences" is a manifestation. Apply this rule to every Personality block.

**Age and energy default:** younger characters (late teens / twenties human equivalent). Older characters should be vital and dynamic, not efficient and weathered.

> **📋 Note:** To enforce a baseline depth floor (a minimum character count) on generated `hiddenInfo`, see [Minimum output depth](/appendix/ai-advanced-techniques#minimum-output-depth) in the Advanced AI Techniques appendix.
