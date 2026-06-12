---
tab: "ai"
section: "imagePromptConfiguration"
title: "Image Prompt Configuration"
kind: "schema"
summary: "Custom prompt templates for AI image generation per content category. Author-provided strings layered on top of Voyage's default image prompts for NPC portraits, location art, and region art."
order: 210
advanced: false
uiLocation: "AI → Image Prompts"
uiSubtitle: "\"Custom prompt templates for NPC, location, and region art\""
editor: "JSON only"
related: "npcs - per-NPC portrait generation uses these templates; locations - location art layered onto location image generation; regions - region art layered onto region image generation"
---

## Example

```json
{
  "imagePromptConfiguration": {
    "npcs": "Style: painted oil portrait, soft warm light, period clothing, head-and-shoulders composition, neutral background.",
    "locations": "Style: matte painting, dramatic atmospheric lighting, weathered surfaces, no people in frame.",
    "regions": "Style: aerial concept art, broad landscape, painterly, time of day appropriate to region biome."
  }
}
```

## Fields

Populating a field injects your text into every image request for that category, useful for enforcing a consistent style across the world (e.g. "watercolor, soft edges, painterly" applied to every NPC portrait).

### npcs

`npcs`: prepended/appended to every NPC portrait generation request. Useful for locking down portrait style and framing without writing the same instruction in every NPC's `basicInfo`.

### locations

`locations`: applied to every location art request. Use for environment-consistency directives (camera angle, mood, art style).

### regions

`regions`: applied to every region art request. Region art is typically broader landscape framing; this slot enforces that.

> **📋 Note:** All three fields are optional. The engine substitutes Voyage's default prompt when a field is empty or absent. There is no length limit documented; treat as a normal narrative prompt and keep it concise enough to not crowd out the actual content prompt.

## Differentiated prompts via labelled sections

A single `npcs` (or `locations` or `regions`) string can contain multiple labelled sections, and the image model sorts on the NPC's type/category when generating. Use this pattern when you want different style guidance for distinct character classes (humanoid vs. creature, civilian vs. military, undead vs. living) without authoring per-NPC prompts.

```json
{
  "imagePromptConfiguration": {
    "npcs": "Humanoid:\n[Style directives for human-form characters: anime portrait, cell-shaded line art, period-appropriate clothing tags, eye and hair colour anchors, full-body composition.]\n\nCreature / Non-humanoid:\n[Style directives for monsters, beasts, summons, constructs: scale and feature tags (horns, wings, tails, claws), no clothing tags, natural-stance posing, full-body silhouette must be visible.]\n\nUndead / Skeletal:\n[Style directives for undead characters: skeletal features, hollow or glowing eye treatment, decay-state tags by stage, posture and clothing reflecting the character's pre-death role.]"
  }
}
```

### How the sort works

**How the sort works:** the AI reads the NPC's `type`, `basicInfo`, and `visualDescription` together with the full IPC string and matches the section whose label best fits the character it is generating. A section labelled `Humanoid:` applies when the character reads as human-form; `Creature:` applies when the character reads as a beast or non-humanoid; etc. Sections that don't match are ignored for that generation.

### Labelling rules

**Labelling rules that improve sorting accuracy:**

- **Bold, capitalised labels** with a trailing colon — `Humanoid:`, `Creature:`, `Undead:`. The model uses the label as the sort key; lowercase or punctuation-soft labels read as prose.
- **One blank line between sections.** Helps the model treat them as distinct branches.
- **Mutually exclusive categories.** Overlapping labels (`Humanoid` + `Civilian` + `Military` all valid at once) produce inconsistent output. Pick one axis (form, role, faction, status) per IPC field.
- **Cover the full space.** If your NPC roster includes a category not represented by any section, the model falls back to whichever section is closest or to the engine default. A `Default:` or `Other:` catch-all section is worth including.

### Applying to locations and regions

The same pattern works for `locations` (interior vs. exterior, urban vs. wilderness, settled vs. ruined) and `regions` (climate biome, faction-controlled vs. wilderness, day vs. night).

> **📋 Note:** For a more structured pattern that splits each category prompt into a fixed style scaffold plus per-instance variable slots (and combines naturally with the labelled-sections approach above), see [Scaffold and variable-slot image prompts](/appendix/ai-advanced-techniques#scaffold-and-variable-slot-image-prompts) in the Advanced AI Techniques appendix.
