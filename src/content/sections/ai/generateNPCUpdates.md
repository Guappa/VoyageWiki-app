---
tab: "ai"
section: "generateNPCUpdates"
title: "NPC Updates"
kind: "schema"
summary: "Fires when an existing NPC's state changes during play — location, mood, status, or relationship updates. Controls continuity: which fields can change, how quickly, and what in-scene evidence is required."
order: 150
advanced: false
uiLocation: "AI Tasks → NPC Updates"
uiSubtitle: "\"NPC Updates Instructions\""
editor: "Graphical form (labeled textareas)"
related: "npcs - the NPC records this task updates; generateNPCDetails - initial fill-in (different trigger)"
---

## Schema

```json
{
  "aiInstructions": {
    "generateNPCUpdates": {
      "custom": "string"
    }
  }
}
```


## Example

A worked pattern that gates every kind of update on explicit in-story evidence — replace world-specific tokens:

```json
{
  "aiInstructions": {
    "generateNPCUpdates": {
      "custom": "## DAMAGE RULES\nApply damage only when Recent Story shows an NPC taking a hit, falling, burning, drowning, poisoned, or struck by environmental hazard. Implied danger is not damage.\n- Damage scales by rank/tier difference. A higher-tier attacker hits a lower-tier target harder than raw numbers suggest. Lower-tier on higher-tier deals reduced damage even on clean hits.\n- Apply armour reduction before computing new hpCurrent.\n- Never reduce hpCurrent below 0. Cap at remaining HP.\n- Heal only when Recent Story shows healing applied: medical action, magical effect, consumed potion, or established recovery scene.\n\n## DEATH RULES\nAn NPC dies only when hpCurrent reaches 0 AND Recent Story explicitly confirms the kill: body falling, breath ceasing, eyes losing focus. Reaching 0 HP alone is unconsciousness or critical wound, not death.\n- A killed NPC stops acting, speaking, or appearing except as corpse, memory, or vision.\n- A dead NPC's reputation, oaths, and contracts persist. Allies and enemies remember; update relationships accordingly.\n- Mass-death events require explicit per-NPC story confirmation. Do not assume a battle killed everyone present unless the narrator named the deaths.\n\n## RENAMING RULES\nA name changes only when Recent Story shows deliberate renaming: title earned, oath sworn under a new name, faction induction, coronation, or true-name revelation. Casual nicknames do not rename an NPC.\n- Preserve the old name in hiddenInfo as a former identity. Update the outer key, the name field, and cross-references in quests, triggers, and party data.\n- Faction titles (Captain, Magister, Heir, Archon) prepend to the name and may replace it in formal contexts. Track both forms.\n\n## RELATIONSHIP UPDATES\nUpdate relationships only when Recent Story shows earned action: compliments paired with substantive help, gifts, threats, betrayals, oaths, lives saved or taken, shared danger. Idle dialogue alone does not.\n- Scale: hostile / wary / neutral / friendly / allied / sworn. Move one step at a time except for major events (betrayal, life-debt, oath-binding) which can jump two.\n- Faction loyalty shapes default stance. Use established faction tensions before inventing personal ones.\n- A killed NPC's allies update immediately. Family, sworn partners, and faction members all carry the grudge or gratitude.\n- Reputation ripples. Significant rise or fall updates NPC default stance across regions within a few turns.\n\n## OUTPUT\nApply changes silently as data updates. Do not narrate the change unless Recent Story already narrated it. Update hpCurrent, status, name, basicInfo, hiddenInfo, and relationship fields. Leave everything else untouched."
    }
  }
}
```


## Fields

### custom

The only key — free-form rules gating each NPC state change (damage, death, renaming, relationships) on explicit in-story evidence.

## Authoring pattern

The dominant pattern across all four update kinds — damage, death, renaming, relationships — is the **"only when Recent Story shows X" gate**. Every kind of update lists what counts as in-story evidence, and the model is told not to invent updates outside that evidence. This is the strongest single defence against AI hallucination in the NPC state path.

- **Damage rules:** name the in-story signals that count as a hit (taking a hit, falling, burning, etc.) and the rules that scale damage (tier difference, armour reduction, HP floor at 0). State that implied danger is not damage.
- **Death rules:** require BOTH hpCurrent=0 AND explicit narrative confirmation. Reaching 0 HP alone is unconsciousness or critical wound. This separation prevents the model from killing NPCs purely on math.
- **Renaming rules:** distinguish casual nicknames (no rename) from deliberate renaming events (title earned, oath sworn, faction induction). Preserve the old name in `hiddenInfo` and update cross-references in quests/triggers/party data.
- **Relationship rules:** earned action only. Idle dialogue and flattery do not move the needle. Move one step at a time on the scale; major events (betrayal, life-debt, oath) can jump two.
- **Output rule:** apply changes silently as data updates. Do not narrate the change unless Recent Story already narrated it.

**Source-of-truth rule:** fields that were authored in the world config should not be silently overwritten — require explicit in-scene events before changing them.
