---
tab: "other"
section: "regionArchetypes"
title: "Region Archetypes (Advanced)"
kind: "schema"
summary: "These strings go to the AI when it needs to describe or expand a region. Write them as tone directions - what makes this type of terrain or territory feel distinct politically, physically, and atmospherically."
order: 100
advanced: true
uiLocation: "Other → Advanced → Region Archetypes"
uiSubtitle: "\"Region archetypes for Region Details generation\""
editor: "JSON only (key → string map)"
related: "regions - archetypes are referenced when generating Region Details"
---

## Example

```json
{
  "Seat of Power": "Geography:\n- This is where decisions that affect other regions are made\n- Infrastructure serves authority first - roads, walls, and supply lines all converge here\n- Wealth and hierarchy are physically visible: monuments, garrison districts, administrative buildings\n\nDynamics:\n- Factions that want influence must be present here; absence is itself a political act\n- Information flows inward faster than it flows outward\n\nHistory:\n- Something was built here to last, and the decision of what to build reveals what the founders valued\n\nAtmosphere:\n- Power is never entirely comfortable; even those who hold it watch for who might take it",
  "Frontier": "Geography:\n- This region sits at the edge of settled territory - beyond it, mapping becomes unreliable\n- Resources exist but extraction is dangerous; those who work here accept that as the cost\n- Authority is thin and mostly self-imposed by whoever can enforce it locally\n\nDynamics:\n- Distance from the center means news, law, and aid all arrive late\n- The people here have already decided they can handle problems themselves\n\nHistory:\n- Something drove the first settlers here; it shaped their character and their relationship to the rest of the world\n\nAtmosphere:\n- Self-reliance is not a virtue here, it is a survival requirement"
}
```

## Structure

### Four-section entry format

A well-structured entry uses four sections: `Geography` (physical and infrastructure character), `Dynamics` (who holds power, how information and resources flow), `History` (what shaped this region and what founding decisions reveal), and `Atmosphere` (the emotional and social register of being here). Three to four bullets per section is sufficient.

## Behaviour

### Empty-section crash

> **⚠️ Warning:** Leaving this section empty causes a hard engine crash when `generateRegionDetails` fires (which happens for regions with `detailType: "basic"` when the party first enters them). Worlds where every region has pre-authored detailed content will not invoke this code path, but defining at least one entry is recommended as defence-in-depth.

### Override and suppression

> **📋 Note:** To override or fully ignore the engine-selected archetype for a region (or null it out entirely for certain region types), see [Behavior suppression and archetype override](/appendix/ai-advanced-techniques#behavior-suppression-and-archetype-override) in the Advanced AI Techniques appendix.