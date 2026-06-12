---
tab: "ai"
section: "generateActionInfo"
title: "Action Info"
kind: "schema"
summary: "Fires on action resolution and combat. High priority: governs all mechanically-weighted actions — combat, spells, skill checks, and social rolls. Missing rules create inconsistent outcomes."
order: 310
advanced: true
uiLocation: "AI Tasks → Advanced → Action Info"
uiSubtitle: "\"Action Info Instructions\""
editor: "Graphical form (labeled textareas)"
related: "generateStory - primary narration; resourceSettings - resource definitions used in combat"
---

## Schema

```json
{
  "aiInstructions": {
    "generateActionInfo": {
      "custom": "string"
    }
  }
}
```


## Example

```json
{
  "aiInstructions": {
    "generateActionInfo": {
      "custom": "## Success levels\nFour outcomes: Critical Failure, Failure, Partial Success (goal achieved at a cost), Success, Critical Success.\n\n## Difficulty scale\nEasy — routine for someone with the skill. A trained character succeeds without drama.\nMedium — requires real effort or focus. A trained character succeeds with consequence possible.\nSomewhat Hard — meaningful risk even for specialists.\nHard — specialists may fail. Untrained characters almost always fail.\nVery Hard — specialists require exceptional effort.\nExtremely Hard — requires exceptional skill AND favourable circumstances.\nImpossible — no mundane attempt can succeed.\n\n## Combat\n[Add: how damage scales with success level, armor and weapon interactions, flanking or environmental advantage rules]\n\n## Social and skill actions\n[Add: social difficulty calibration, what actions qualify as Easy vs Hard, per-domain guidance for your world's primary skill categories]\n\n## Magic\n[Add: difficulty axes for spells — scale (how much reality changes), complexity (precision required), opposition (target resistance). High on two axes: Very Hard. All three: Extremely Hard or Impossible.]"
    }
  }
}
```


## Fields

### custom

The only key — free-form rules the engine applies when resolving any mechanically-weighted action.

## Authoring pattern

Cover in `custom`:

- Combat system (e.g. D&D 5e structure, four success levels: failure, partial, success, critical).
- Class strengths and equipment restrictions — which armour classes each class can use.
- Skill check DC scale from easy to extreme.
- Magic difficulty axes: scale, complexity, opposition.
- Item use in combat: rules for how items affect resolution (e.g. "this potion heals 20 HP mid-combat") belong here, not in [`ItemGenerationAndUsage`](/ai/generateItemGenerationAndUsage).
