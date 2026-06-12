---
tab: "mods"
section: "modding"
title: "Modding"
kind: "guide"
summary: "How to create and use `mods` in Voyage Heroes. Layered partial world JSON: same editor, same schema, no required sections."
order: 10
advanced: false
---

Mods are partial world configurations that can be layered onto any world. The creation process is identical to creating a world - same editor, same JSON sections, same schema - with one difference: the **Type** field in the creation UI is set to **Mod** instead of World. No section is required; include only what the mod contributes.

## How mods work

A mod is a partial V33 world JSON. Most top-level sections can be included freely - [`triggers`](/mechanics/triggers), [`locations`](/world/locations), [`items`](/world/items), [`npcs`](/world/npcs), [`abilities`](/mechanics/abilities), and so on. [`aiInstructions`](/ai/aiInstructions) is the exception (see below). When a world imports a mod, the engine merges each section into the world:

- **Content sections** (`items`, `locations`, `npcs`, `triggers`, etc.) - mod entries are **appended** to the world's existing entries. `items` is directly tested; `locations` is confirmed by the official description. Behavior of other content sections has not been independently tested.
- **[`nameFilterSettings`](/other/nameFilterSettings)** - **base world wins on collision**. Existing keys are preserved; new keys from the mod are added. The mod cannot overwrite an existing entry.
- **`aiInstructions`** - special case, see [What a mod can contain](#what-a-mod-can-contain).

The official description: *"A mod is just a partial world. Instead of having every section filled, you can just make 1 section, like `locations`, and then publish it. Anyone who imports your mod will add on all of your locations to their existing world's locations."*

## Creating a mod

1. Click **Create → Create a World** in the Voyage UI
2. Set **Type** to **Mod** (instead of World) in the creation form
3. Fill in only the sections the mod should contribute - leave all others empty
4. Publish to receive a `shortId`

The editor UI, all tabs, and all JSON fields are identical to a world. The Type field is the only distinction.

**Mods validate against the full V33 schema.** All required top-level fields (`configVersion`, `heroesVersion`, [`storySettings`](/world/storySettings), `triggers`, `items`, `npcs`, etc.) must be present - even in a mod that only contributes one section. Leave every section you don't need as an empty object `{}` or empty array `[]`. The default world template is the correct starting point for a new mod.

## Schema

The `mods` field on a world is the list of installed mods:

```json
"mods": [
  { "shortId": "abc123", "version": null },
  { "shortId": "def456", "version": 2 }
]
```

| Field | Type | Notes |
|---|---|---|
| `shortId` | string | Platform-assigned identifier. Find it in the Voyage UI Mods tab or from the mod author. |
| `version` | number \| null | Pin a specific version. `null` = always use the latest published version. |

## What a mod can contain

Any standard V33 top-level section - `triggers`, `locations`, `items`, `npcs`, `abilities`, `nameFilterSettings`, and so on. A mod containing only `triggers` is valid; so is one containing only `nameFilterSettings`. A mod can also span multiple sections. Include whatever sections the mod contributes.

**`aiInstructions` is a special case.** It is a top-level field but requires all 12 task keys to be present whenever it is included - you cannot include only the tasks you want to change. The other 11 must be present as empty `{}`.

## Examples

### Name replacement mod (`nameFilterSettings` only)

```json
{
  "nameFilterSettings": {
    "Marcus": { "replacements": ["Aldric", "Brennan", "Cael", "Dorian", "Emric"] },
    "Elena":  { "replacements": ["Mira", "Sable", "Vesper", "Corrin", "Laith"] }
  }
}
```

### NPC intent grounding mod (`aiInstructions` only)

```json
{
  "aiInstructions": {
    "generateStory":             {},
    "generateInitialStart":      {},
    "generateCharacterBackground": {},
    "generateActionInfo":        {},
    "generateNPCIntents": {
      "custom": "Stay grounded in the current scene. Do not invent new threats or emergencies that have not been established. Do not escalate calm scenes without cause. NPC goals should follow from what is actually happening, not from a need to manufacture tension."
    },
    "generateNewNPC":            {},
    "generateNPCDetails":        {},
    "generateLocationDetails":   {},
    "generateRegionDetails":     {},
    "generateFactionDetails":    {},
    "generateEncounters":        {},
    "ItemGenerationAndUsage":    {}
  }
}
```

### Multi-section mod (`nameFilterSettings` + `aiInstructions`)

```json
{
  "nameFilterSettings": {
    "ozone":                        { "replacements": [""] },
    "efficiency":                   { "replacements": ["competence", "skill"] },
    " with practiced efficiency":   { "replacements": [""] }
  },
  "aiInstructions": {
    "generateStory":             {},
    "generateInitialStart":      {},
    "generateCharacterBackground": {},
    "generateActionInfo":        {},
    "generateNPCIntents":        {},
    "generateNewNPC": {
      "custom": "Derive names from world context: use the current region, location, and world background as cultural sources. Do not default to generic fantasy or modern name pools."
    },
    "generateNPCDetails":        {},
    "generateLocationDetails":   {},
    "generateRegionDetails":     {},
    "generateFactionDetails":    {},
    "generateEncounters":        {},
    "ItemGenerationAndUsage":    {}
  }
}
```

`type: "story"` conditions are well-suited for trigger mods - they let conditions be expressed as plain-language AI-evaluated descriptions rather than structured boolean checks, which is useful when the trigger fires on contextual cues with no discrete state to query.

## Referencing a mod in a world

The `mods` field is managed through the **Mods** tab in the world editor. The tab shows active mods in numbered order, with arrows to reorder them and an × to remove. Each mod entry displays its **ID** (the `shortId`) directly in the UI - no need to find it elsewhere. A **Total Mod Rating** badge reflects the aggregated content rating of all active mods. A separate **Bookmarked Mods** section holds saved mods that are not currently active.

**Changes do not take effect until you click Apply.** The Apply button merges the active mod stack into the world configuration. This is also when validation errors from the merged result surface - if a mod pushes the world over a limit, the error appears on apply.

## Limits and collisions

Mods merge additively into the world, so the combined result must still satisfy all V33 size and count limits. A mod that pushes a near-full world over any limit will fail to apply - the engine returns a generic **"Failed to build mods"** error with no indication of which limit was hit or which mod caused it.

Array sections accumulate across world + all active mods and the combined total must stay within section limits. When the error occurs, remove mods one at a time to isolate the culprit.

### nameFilterSettings collision

**Base world wins.** When both the world and a mod define the same key, the world's value is preserved and the mod's value for that key is ignored. New keys not present in the world are added from the mod. A mod cannot overwrite existing entries.

### Content section merge

**Mod entries are appended.** A mod adding `items` entries will have those entries appear in the merged world alongside the base world's existing items. `locations` follows the same pattern per the official description. Behavior of other content sections has not been independently tested.

### Multi-mod collision

**First mod wins.** When two mods both define the same new key, the mod that appears first in the active mods list takes the key. The later mod's value for that key is discarded.

### version: null means always latest

The Voyage mod list displays `null` version as "latest", confirming it tracks the most recent published version of the mod rather than a pinned one.

### Mod removal fully reverts the merge

Removing a mod from the active list and applying restores the world to its pre-mod state. Content added by the mod does not persist after removal.

### Remix is the top merge layer

A *remix* is the engine's mechanism for cloning a published world into your own editable personal copy. Mechanically, a remix is implemented like a mod — but it always sits at the top of the merge stack. The full priority order is `Remix > Mod 1 > Mod 2 > ...` so the remix layer always wins conflicts, then mods apply in their listed order.

> **⚠️ Warning:** the merge rules above are based on testing, but many users have reported inconsistencies — content occasionally disappears unexpectedly. This shows up most often on **remixed worlds with mods applied on top**, where the stacked merge layers (Remix + Mods) compound the chance of a collision dropping content. If you cannot afford content loss, the safer pattern is to strip the remix layer before adding mods:
>
> 1. Remix the world you want to start from.
> 2. Open the remix in the editor and copy the full world JSON.
> 3. Create a fresh new world (not a remix).
> 4. Paste the JSON into the new world. You now have the same content with no remix layer underneath.
> 5. Apply your mods on top of the new world.
>
> The merge stack is now just `World > Mod 1 > Mod 2 > ...`, with no remix layer to compound collisions.
