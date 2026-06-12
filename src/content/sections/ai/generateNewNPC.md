---
tab: "ai"
section: "generateNewNPC"
title: "New NPC"
kind: "schema"
summary: "Fires for first-pass creation of AI-improvised NPCs only. Does not apply to authored NPCs or quest-spawned NPCs. `generateNPCDetails` still runs on all NPC types on first encounter."
order: 330
advanced: true
uiLocation: "AI Tasks → Advanced → New NPC"
uiSubtitle: "\"New NPC Instructions\""
editor: "Graphical form (labeled textareas)"
related: "generateNPCDetails - second-pass fill-in that runs on all NPCs including these; npcTypes - templates that shape first-pass creation"
---

## Schema

```json
{
  "aiInstructions": {
    "generateNewNPC": {
      "custom": "string"
    }
  }
}
```


## Example

A worked pattern — replace world-specific tokens with your own:

```json
{
  "aiInstructions": {
    "generateNewNPC": {
      "custom": "## MANDATORY FIELDS\nEvery improvised NPC must declare:\n- **Role** (specific occupation, not a vague label): 'dockside cooper', 'mountain guide', 'cartel courier'.\n- **Origin / culture** (anchors name + speech register): which region, clan, or tradition they come from.\n- **Rank or skill tier** (chooses one from your world's authority ladder): which rung they sit at and how they behave toward those above and below.\n- **One behavioral hook** (one thing they do or want, not a trait list).\n- **One short-term goal** the current scene can engage with.\n\n## NAMING RULES BY ORIGIN\n[Replace with your world's geographic or cultural groups and their phonetic registers.]\n- Central territories: short, grounded names — Edric, Mara, Owen, Holt.\n- Northern frontier: harder consonants, longer names — Halvard, Sigrun, Brekt.\n- Coastal cities: Latinate surnames — Varano, Crell, Senne.\nAvoid generic fantasy names (Theron, Aldric, Zara, Mira).\n\n## VISUAL DESCRIPTION FORMAT\nvisualDescription is a comma-separated tag list, not prose. No sentences, no pronouns, no exposition.\n- Humanoid example tags: Athletic Build, Cropped Hair, Cyan Eyes, Leather Tunic, Arm Guards, Sigil-Marked Cloak.\n- Non-humanoid example tags: Six-Horned, Cobalt Scales, Tattered Wings, Two Tails, Crystalline Spines, Tree-Bark Hide.\nAlways full-body, grounded in a specific location (city street, training hall, sacred grove, battlefield).\n\n## TIER + LEVEL\nMatch authored NPC conventions: trivial / weak / average / strong / elite / boss / mythic. New improvised NPCs default to average or weak unless the scene demands otherwise."
    }
  }
}
```


## Fields

### custom

The only key — free-form rules for first-pass creation of improvised NPCs: mandatory fields, naming by origin, `visualDescription` tag format, and tier defaults.

## Authoring pattern

- **Enumerate mandatory fields explicitly.** A bullet list of required elements with one-line per-field rules outperforms paragraph prose. The model treats each bullet as a slot that must be filled before output.
- **Naming rules organised by origin or culture.** This is typically the largest block in the task. Without explicit naming rules the engine produces culturally incoherent names. Detailed worlds define 8-15 named groups, each with its own phonetic register and example names. Organise the groups by region or species so the AI can match a generated NPC's origin to the right name pool.
- **Distinct tag guidelines for humanoid vs. non-humanoid `visualDescription`.** Two short example lists side by side teach the model to switch tag vocabulary when generating creatures vs. people. The AI sorts on the noun being generated and applies the matching tag style.
- **Anchor tier to authored NPCs.** Improvised NPCs should match the tier scale defined in your authored set; new NPCs should not jump to elite without justification.

> **📋 Note:** To prevent specific NPC types, species, or categories from being generated ambiently (while still allowing them at authored locations), see [Restricted spawn lists](/appendix/ai-advanced-techniques#restricted-spawn-lists) in the Advanced AI Techniques appendix.
