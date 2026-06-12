---
tab: "mechanics"
section: "triggers"
title: "Triggers"
kind: "schema"
summary: "Conditional automations that fire effects when their conditions all pass. The primary mechanism for quest activation, state flags, world-mutation, and one-time narrator instructions. Triggers are deterministic where narrator instructions are probabilistic -- use `triggers` for anything that must mechanically happen."
order: 90
advanced: true
uiLocation: "Mechanics → Advanced → Triggers"
uiSubtitle: "\"Triggers to prompt the AI to do something in specific situations\""
editor: "JSON + ADD ITEM"
related: "quests - `quest-init` effects activate quests; skills - trigger conditions can gate progression on skill values"
---

## Example

A complete trigger: a mechanical gate (`party-location`) and a semantic gate (`story`) combined with AND, firing two effects when both pass. It surfaces a quest only once the player has actually encountered the hook in play.

```json
{
  "discover_ambush_plot": {
    "name": "discover_ambush_plot",
    "recurring": false,
    "conditions": [
      { "type": "party-location", "operator": "equals", "value": "The Wayside Inn" },
      { "type": "story", "query": "the player overhears the patrons planning an ambush on the road" }
    ],
    "effects": [
      { "type": "quest-init", "operator": "set", "value": "The Road Ambush" },
      { "type": "story", "instruction": "The hushed conversation in the corner makes the danger on the road ahead unmistakable." }
    ]
  }
}
```

## How triggers work

A trigger is a named entry in the `triggers` map. Each one is a small rule with two required parts: a list of **`conditions`** and a list of **`effects`**. Every turn the engine checks each trigger; when **all** of a trigger's conditions pass, **all** of its effects fire. That is the whole model — everything else is detail about what you can put in those two lists.

```json
{
  "name": "discover_missing_documents",
  "conditions": [ { "type": "read-boolean", "key": "met_clerk", "operator": "equals", "value": true } ],
  "effects":    [ { "type": "quest-init", "operator": "set", "value": "The Missing Documents" } ],
  "recurring": false
}
```

**When a trigger fires:** by default a trigger fires **once ever** and is then consumed; add `"recurring": true` to let it fire every turn its conditions are met. Each trigger evaluates in exactly one phase, chosen by its conditions: if it has an `action` or `action-text` condition it runs in the **planning phase** (after the player acts, before the story is written), otherwise in the **state phase** (after the story is written).

**What a trigger can gate on (conditions):** whether recent story or the player's action matches a natural-language `query` (AI-judged); the party's current `realm` / `region` / `location` / `area`; any character's `level` or a `resource` value; whether an `entity` (NPC, faction, location, …) is known to the player; which `traits` the party holds or which quests they have completed; and any value you previously stored. Conditions combine with AND — for OR logic or arithmetic you use a script (below).

**What a trigger can do (effects):** start a quest (`quest-init`) or mark an objective complete (`quest-progress`); move the party (`party-location` and friends); change a `resource`; grant or remove `traits`; mark an entity known or unknown; inject a one-time `story` instruction into narration; and read/write boolean, string, number, and array values to persistent storage. A trigger applies at most **5 effects**. Triggers are deterministic: if the conditions pass, the effects happen, every time. (Every quest you write needs at least one trigger that fires its `quest-init`.)

**Scripts — for logic the two lists can't express:** a trigger may also carry an optional **`script`** (JavaScript) for things like counters, OR-logic across conditions, derived math, conditionally skipping effects, or reading and rewriting other triggers. The script runs after the conditions pass and before the effects apply, and can read live game state with `check()`, keep data across turns in `storage`, and add to or rewrite the `effects` array. See **[Trigger Scripts](#trigger-scripts)** below for the full capability and limits reference, and **[Scripting Patterns](/appendix/scripting-patterns)** for worked recipes. Reach for a script only when plain conditions and effects genuinely can't do the job.

The rest of this page is the detailed reference for each condition type, effect type, and the scripting API.

## Reference

The most common use is surfacing quests - a player arrives at a location, conditions pass, and the trigger fires `quest-init` to add the quest to their journal. Triggers also manage world state: writing boolean flags to remember that an event happened, injecting one-time narration, and chaining quests when a previous one completes. Every quest you write needs at least one trigger pointing to it.

**Triggers vs. narrator instructions:** Triggers are deterministic - if conditions are met, effects fire without exception. Narrator instructions in `aiInstructions` are probabilistic - the narrator decides whether to act on them based on context, and can miss complex multi-step logic. Use triggers for anything that must be mechanically guaranteed (quest activation, state gates, key-locked progression). Use narrator instructions for dynamic or flavorful consequences that don't need to be exact (resource consequences, NPC mood shifts, ambient world reactions).

### Condition types

> **📋 Note (`numeric operator names`):** The numeric operators are `greaterThanOrEqual` and `lessThanOrEqual` — no "To" suffix. The engine rejects `greaterThanOrEqualTo` with a hard validation error. The validator enforces this.

| type | extra fields | operators | notes |
|---|---|---|---|
| `game-tick` | - | equals, notEquals, greaterThan, lessThan, greaterThanOrEqual, lessThanOrEqual | - |
| `player-level` | - | same numeric set | Fires if ANY party member matches. |
| `player-resource` | `resource` (key) | same numeric set | Fires if ANY party member matches. Rarely used as a condition in practice — most worlds manage resource thresholds through `usageInstructions` prose rather than triggers. |
| `player-traits` | - | contains, notContains | Fires if ANY party member has the trait. |
| `party-realm` | - | equals, notEquals, regex | - |
| `party-region` | - | equals, notEquals, regex | - |
| `party-location` | - | equals, notEquals, regex | - |
| `party-area` | - | equals, notEquals, regex | - |
| `known-entity` | `entity` (entity name) | equals, notEquals | value is boolean. More commonly used as an **effect** to reveal entities than as a condition. |
| `quests-completed` | - | contains, notContains | value is quest name string |
| `story-text` | - | equals, notEquals, contains, notContains, regex | checks most recent story output |
| `action-text` | - | equals, notEquals, regex | checks pending player command |
| `story` | `query` (string) | - | evaluates session history - see narrator note below |
| `action` | `query` (string) | - | evaluates player action - see narrator note below |
| `read-string` | `key` | equals, notEquals, regex | - |
| `read-number` | `key` | equals, notEquals, greaterThan, lessThan, greaterThanOrEqual, lessThanOrEqual | - |
| `read-boolean` | `key` | equals, notEquals | **`value` must be JSON boolean `true`/`false`, not the string `"true"`/`"false"`** |
| `read-array` | `key` | contains, notContains | value is string/number/boolean element. Rarely used in practice — prefer `read-boolean` or `read-string` for flag and state tracking. |

### Effect types

| type | extra fields | operators | notes |
|---|---|---|---|
| `story` | `instruction` (string) | - | injects a narrative instruction for the Storyteller |
| `quest-init` | - | set | value = quest name. Makes hidden quest available. |
| `quest-progress` | `questId` (quest name) | - | marks progress on a quest |
| `party-realm` | - | set | value = destination name (teleports party) |
| `party-region` | - | set | value = destination name |
| `party-location` | - | set | value = destination name. **Cascade:** automatically updates the party's region, realm, coordinates, and area to match the destination location. You rarely need to set `party-region` or `party-realm` separately when moving a party to a specific location - `party-location` handles all of it. |
| `party-area` | - | set | value = destination name |
| `player-resource` | `resource` (key) | add, subtract, multiply, divide, set | - |
| `player-traits` | - | set, add, remove | `add` appends one trait; `remove` removes one trait; `set` replaces all traits. Adding or removing a trait automatically applies or reverses its attribute, skill, and resource modifiers; if a granted trait carries a skill modifier for a skill the character does not have yet, that skill is created so the bonus always takes effect. |
| `known-entity` | `entity` (entity name) | set, toggle | `value` (boolean) is required for `set`; `toggle` flips the current state and ignores `value`. |
| `write-string` | `key` | set | - |
| `write-number` | `key` | add, subtract, multiply, divide, set | - |
| `write-boolean` | `key` | set, toggle | value = boolean |
| `write-array` | `key` | set, add, remove, clear | set replaces array; add appends; remove removes element; clear empties array |

### Phases and timing

Every trigger evaluates in exactly one phase, decided by its conditions:

| Has an `action` or `action-text` condition? | Phase | Timing |
|---|---|---|
| Yes | Planning | After the player acts, before story generation |
| No | State | After the story is generated |

Each phase has its own independent 500 ms shared script budget; a turn that uses both phases gets two separate budgets that do not combine.

Each player turn runs two separate AI calls in sequence. Understanding this explains why trigger phase matters.

**Planning phase** - A lightweight intent classifier runs first, before story generation. It reads the player's input and classifies the action into a structured intent type. Triggers with `action` or `action-text` conditions evaluate here, which is why they respond immediately rather than a turn late.

**State phase** - The story narrator runs second. All other triggers evaluate here, after narration context is available.

> **📋 Note:** The planning-phase classifier maps every player action to one of the following intent types. This is the signal set the engine uses internally:

| Intent | What it represents |
|---|---|
| `attack` | Direct attack intended to deal damage |
| `mockAttack` | Attack not meant to harm (sparring, warning shots) |
| `subdue` | Attacking to capture without damage |
| `preventAttack` | Stopping someone from attacking (stun, distraction) |
| `evade` | Dodging, cover, stealth to avoid being targeted |
| `defend` | Creating protection for self or others |
| `heal` | Healing self or allies |
| `buff` | Empowering self or allies |
| `interactNPC` | Meaningful, specifically directed social interaction -- not basic greetings |
| `readDocument` | Reading a specific named book or document; target = exact item name |
| `teleport` | Instantaneous relocation (magic, portals) |
| `fastTravel` | Fast travel menu usage |
| `travel` | Leaving for a distant location -- requires actual movement verbs. Dialogue about travel ("I need to go there") does NOT trigger this. |
| `move` | Moving to a different area within the current location -- requires an explicit nearby destination. Generic repositioning within the same area does NOT trigger this. |
| `sleep` | Attempting to sleep |
| `acceptQuest` | Quest acceptance -- surfaces as a UI prompt after the turn ends rather than through prose detection |
| `other` | Everything else: talking, gesturing, aiming, waiting, doing nothing |

The `travel` / `move` split is strict. The classifier deliberately errs on the side of caution -- only fires movement intents when there is high confidence the player is actually moving, not just discussing it.


`acceptQuest` surfaces as a UI prompt after the turn ends -- the player clicks to confirm rather than accepting through prose.

**Condition evaluation cost:**

- Mechanical conditions (geographic, tick, level, resource, read-*) check immediately.
- Semantic conditions (`story`, `action`) use AI evaluation - they are expensive.

> **⚠️ Warning:** Do not mix `action`/`action-text` with `story`/`story-text` in the same trigger unless you explicitly want a planning-phase trigger gated by recent story context. Mixing is valid but rarely intentional - the result is a planning-phase trigger that also requires story history to match.

**Authoring principles:**

- **Prefer mechanical over semantic.** Use `story` or `action` conditions only when no mechanical condition or `story-text`/`action-text` regex can express the same rule. Semantic conditions are evaluated by AI every turn they are reached - they are expensive.
- **Keep triggers small.** Most triggers should have 1-3 conditions and 1-2 effects. Never exceed 5 effects — extras are silently discarded at apply time.
- **Context triggers are evaluated selectively.** Only a subset of context triggers (those using `story` or `action` conditions) are evaluated by the LLM each tick — the engine picks the most relevant ones rather than evaluating every context trigger on every turn. Mechanical triggers (no `story`/`action` conditions) are evaluated without an LLM call and don't compete for this budget. Keep context triggers specific so they rank highly when relevant.
- **The trigger bank has collection-level limits.** The engine enforces maximum trigger counts at publish time. Very large trigger banks may hit these limits and have mutations discarded. Prefer surgical triggers over broad catch-alls.
- **`recurring: false` by default.** Use `recurring: true` only for ongoing systems: auras, counters that increment every turn, repeated blockers, or persistent narrative guidance. If you find yourself setting recurring on a one-time event, reconsider.
- **`story` effects are deferred.** A `story` effect does not rewrite the current turn's narration - it influences the *following* narration. Do not use it expecting immediate output in the same turn.
- **Most effects apply within the same tick** - exceptions are listed below.

**Mutating semantic query strings:**

Semantic conditions (`story`, `action`) are AI-evaluated: the engine compares the query string against session history (`story`) or the pending player action (`action`) and decides if the meaning matches. Set the query string once at authoring time and leave it stable; mutating it from a script during gameplay is unreliable.

**Notes:**

- `recurring: false` → fires once and never again. `recurring: true` → fires every turn conditions are met, including tick 0.
- **Maximum 5 effects per trigger.**

> **🐛 Common issue:** A `story` effect at tick 0 does not affect the initial scene. The opening story is generated from `storyStart` text before triggers run, so any `story` instruction injected at tick 0 arrives too late and is ignored. Use `storyStart` text for opening context, or gate the story effect on `game-tick greaterThan 0`. Effects beyond 5 are not applied.
- `quest-init` value must exactly match the quest's outer key.
- Use `read-*` + `write-*` effects to build gate patterns: set a boolean when a gate passes, then check it in subsequent triggers to avoid re-evaluating expensive `story` conditions every turn.

### Limits

The engine enforces these at publish time and again at runtime. Trigger-script writeback that would violate any of them has all of its trigger mutations discarded for the phase.

| Limit | Value |
|---|---|
| Effects applied per trigger | 5 (extras silently dropped at apply time) |
| Conditions per trigger | 5 |
| Semantic triggers (any with a `story` / `action` condition) | 200 |
| Mechanical triggers (no `story` / `action` condition) | 500 |
| Whole-trigger JSON, including the `script` field | 10,000 chars |
| Condition `query` and effect `instruction` | 1,000 chars each |
| Any condition or effect `value` (stringified) | 100 chars |

### Gotchas

**ANY/ALL party behavior:**

`player-level`, `player-resource`, and `player-traits` **conditions** are satisfied when **any** character in the party matches. A level gate fires when the first character reaches that level, not when all do. A low-HP trigger fires if any single character is below the threshold.

Correspondingly, `player-resource` and `player-traits` **effects** apply to **all** party characters simultaneously — there is no way to target a specific character.

**Turn 0 gotcha:** `story` effects authored in triggers that fire at game tick 0 do **not** affect the initial story generation. The initial story is already composed before tick-0 triggers apply. Use `storyStart` on the story start entry for the opening narrative, or gate story effect triggers on `game-tick >= 1`.

**Effect cap:** Effects are filtered through the Effect schema and capped at **5 per trigger** at apply time. Effects beyond index 4 are silently discarded. This cap also applies to effects produced by trigger scripts.

**`party-location` cascade:** Setting `party-location` automatically cascades to set the party's region and realm (derived from the location's `region` and realm chain), and moves the party to the first area defined in that location. You do not need separate `party-region` or `party-realm` effects when teleporting via `party-location`.

**`known-entity` toggle operator:** The `known-entity` effect accepts two operators: `"set"` (requires a `value: true/false`) and `"toggle"` (flips the current state, no `value` needed). Use `toggle` when you want to reverse visibility without knowing the current state.

**`{questId}_objective` naming convention:** A common authoring pattern is to name objective-phase triggers `{questId}_objective` or `{questId}_objective_N` (e.g. `missing_documents_objective`, `missing_documents_objective_2`) so they are easy to find and group. Triggers named with this pattern are automatically filtered out of the active pool while the quest is unaccepted or abandoned — they will not fire unless the quest is in an accepted state.

**`triggerWritable` type matching:** Always write and read using the same type. Mixing `write-string` and `read-number` on the same storage key produces no error but the read does not return the stored value. Documented fallback behaviour for type mismatches: `read-number` on a non-numeric value returns `0`; `read-array` on a non-array returns `[]`; `read-string` on a non-string returns `""`; `read-boolean` on a non-boolean returns `false`. The stored value remains intact in storage -- only the typed read is coerced.

> Omit `embeddingId` from `story` conditions you author by hand. The engine computes and assigns it automatically.

## Trigger scripts

Triggers support an optional `script` field containing JavaScript. Scripts run after conditions pass and before effects apply, giving you full programmatic control over what happens when a trigger fires.

```json
{
  "name": "my_trigger",
  "conditions": [],
  "script": "log('tick ' + check({ type: 'game-tick' }))",
  "effects": [],
  "recurring": true
}
```

`conditions`, `effects`, and `script` can be combined freely. A trigger with no conditions fires every turn. A trigger with no effects and no script does nothing visible, but non-recurring triggers are still consumed.

**Execution order within a trigger:**
1. All conditions evaluate (mechanical + semantic)
2. If conditions pass: script runs (if present), then effects apply

Scripts never run during condition evaluation. Triggers that have `action` or `action-text` conditions run in the **planning phase** rather than the state phase -- this is determined by the trigger's typed conditions, not anything the script does.

### What scripts can access

`check(condition)` - reads game state using the same condition format as typed triggers. Without an operator, returns the raw value:

| call | returns |
|---|---|
| `check({ type: 'party-realm' })` | `"Mythic Kingdom"` |
| `check({ type: 'party-region' })` | `"Darkwood"` |
| `check({ type: 'party-location' })` | `"Throne Room"` |
| `check({ type: 'party-area' })` | `"West Wing"` |
| `check({ type: 'game-tick' })` | `42` |
| `check({ type: 'player-level' })` | `{ "Hero": 5, "Mage": 8 }` |
| `check({ type: 'player-resource', resource: 'health' })` | `{ "Hero": 20, "Mage": 15 }` |
| `check({ type: 'player-traits' })` | `{ "Hero": ["Rogue"], "Mage": ["Noble"] }` |
| `check({ type: 'known-entity', entity: 'Shadow Brotherhood' })` | `true` |
| `check({ type: 'quests-completed' })` | `["Clear the Road"]` |
| `check({ type: 'read-string', key: 'faction' })` | `"Rebels"` (or `""` if missing) |
| `check({ type: 'read-number', key: 'counter' })` | `3` (or `0` if missing) |
| `check({ type: 'read-boolean', key: 'flag' })` | `true` (or `false` if missing) |
| `check({ type: 'read-array', key: 'items' })` | `["sword"]` (or `[]` if missing) |
| `check({ type: 'story-text' })` | most recent story text (raw) |
| `check({ type: 'action-text' })` | array of player action inputs (raw) |
| `check({ type: 'story' })` | most recent story text (raw, no AI evaluation) |
| `check({ type: 'action' })` | array of player action inputs (raw, no AI evaluation) |

> **📋 Note:** `story-text` and `action-text` return the raw text directly. `story` and `action` also return raw text inside `check()` -- they do **not** trigger AI semantic evaluation when called from a trigger script. LLM semantic evaluation of story/action conditions happens only against declared typed conditions in the trigger definition (the engine evaluates those separately), never inside script-side `check()` calls. Inside a trigger script, all four return raw text regardless of operator. Use `/pattern/.test(check({ type: '...' }))` for regex matching.

With an operator, returns `true` or `false` (same logic as typed conditions - `player-level`, `player-resource`, `player-traits` return `true` if ANY character matches). The `regex` operator returns `undefined` in `check()` - use `/pattern/.test(check({ type: '...' }))` instead.

`storage` - a plain object that persists across turns. Supports strings, numbers, booleans, arrays, and nested objects. Read with `storage.myKey`, write with `storage.myKey = value`. Typed triggers can also read and write storage via `read-*` / `write-*` conditions and effects.

> **⚠️ Warning (`storage` serialization):** `storage` is JSON round-tripped between turns. Strings, numbers, booleans, `null`, plain arrays, and plain (arbitrarily nested) objects survive as written. A few types survive the script boundary but are coerced by the round-trip: `Date` becomes an ISO string, while `RegExp`, `Map`, `Set`, `TypedArray`, functions, and symbol *values* become `{}` or `null`; `NaN` and `Infinity` store as `null`. Two cases instead reject the **entire phase's** storage writes and revert to the pre-turn snapshot: a `BigInt` value, or a circular reference. Reassigning `storage` itself to a non-object (array, `null`, a primitive) resets it to `{}` for the turn, and symbol *keys* drop silently at the clone boundary. Stick to JSON-shaped data; convert dates and regex sources to strings before writing.

`effects` - the trigger's typed effects array, pre-populated before the script runs. Scripts can add, modify, or remove effects before they apply. Maximum 5 effects apply per trigger (extras are ignored). Only valid effect shapes are applied - malformed effects are silently dropped.

```javascript
effects.push({ type: 'story', instruction: 'Something happens.' })
effects.push({ type: 'player-resource', resource: 'health', operator: 'add', value: 10 })
effects[0] = { type: 'story', instruction: 'Replaced.' }
effects.length = 0  // remove all effects
```

`skip` - set `skip = true` to prevent all effects from applying. Also prevents the trigger from being counted as fired, so non-recurring triggers will fire again next turn. Defaults to `false` each script run.

`triggers` - the full triggers object. Scripts can read, modify, add, or delete any trigger, including themselves. Other scripts in the same phase can read your changes. Changes take effect on the next turn. Validated before saving (size and count limits apply, but scripts can set trigger shapes the editor would reject) - if validation fails, all trigger changes from scripts in the same phase are discarded.

```javascript
triggers['villain_defeated'].conditions[0].query = 'the villain has been defeated'
triggers['Other Trigger'].effects.push({ type: 'story', instruction: '...' })
```

`info` - engine version info. `info.engineVersion` returns the engine version number (e.g. `33`). `info.semanticVersion` returns the semantic version string (e.g. `'0.33.0'`). Useful for branching on version when the engine changes.

`log` / `console` - `log('hello')` and `console.log('hello')` both write to `/logs`. The trigger name is automatically prefixed. `console.warn`, `console.error`, and `console.info` also work (all go to the same log).

**Limits** (per phase - state and planning each get independent budgets):

- 500 milliseconds total execution time shared across all scripts in the same phase. If one script uses all the time, remaining scripts in that phase are skipped (their typed effects still apply). Scripts that exceed the limit are killed mid-execution and their changes discarded.
- 16 MB base memory per isolate, plus headroom proportional to the total trigger-set size. Scripts that exceed it are terminated for the rest of the phase.
- Scripts run in a sandboxed isolate: no Node.js built-ins (`require`, `process`, `Buffer`, `setTimeout`) and no `Function` constructor.
- Maximum 5 effects per trigger (extras are ignored).

**Error handling:** Script errors (syntax, runtime, timeout) are logged and the script is skipped. Typed effects still apply. `storage` and `triggers` changes from a failed script are discarded. Errors appear in `/logs` with type `trigger-script-error`.

### Snippets

#### Skip effects conditionally

Only apply a heal when someone is actually wounded:
```javascript
const hp = check({ type: 'player-resource', resource: 'health' })
if (!Object.values(hp).some(v => v < 10)) { skip = true }
```

#### OR logic across conditions

Typed conditions are AND-only; use a script for OR:
```javascript
const hasTrait = check({ type: 'player-traits', operator: 'contains', value: 'Noble' })
const hasQuest = check({ type: 'quests-completed', operator: 'contains', value: 'Earn the Writ' })
if (!hasTrait && !hasQuest) { skip = true }
```

#### Dynamic storage counter

```javascript
storage.turnCount = (storage.turnCount || 0) + 1
```

#### Track visited locations

```javascript
if (!storage.visited) { storage.visited = [] }
const loc = check({ type: 'party-location' })
if (!storage.visited.includes(loc)) { storage.visited.push(loc) }
```

#### Rewrite a trigger condition dynamically

Update another trigger's semantic query based on current state:
```javascript
const villain = storage.currentVillain || 'the dark lord'
triggers['villain_defeated'].conditions[0].query = villain + ' has been defeated'
```

#### Replace an effect dynamically

Swap an effect based on turn count:
```javascript
const tick = check({ type: 'game-tick' })
effects[0] = { type: 'story', instruction: 'Turn ' + tick + ': the world shifts.' }
```

#### Self-delete after firing

Removes the trigger from the runtime evaluation list permanently. Boolean flags in conditions already prevent re-firing, but the engine still evaluates conditions each tick even when nothing happens. Self-deletion eliminates that overhead:
```javascript
delete triggers['Arrive Forest Village']
```

#### Cascade cleanup

When a quest-init trigger fires, also delete the intermediate briefing trigger. By the time the quest-init fires, the intermediate has already delivered its narrative beat and set its flag - it will never fire again, so removing it shrinks the evaluation list:
```javascript
// intermediate already served its purpose; remove it
if (triggers['Village Crisis Briefing']) {
  delete triggers['Village Crisis Briefing']
}
// self-delete this trigger too
delete triggers['Discover Village Attack']
```

#### Suppress a recurring trigger conditionally

Silence a trigger under specific circumstances (e.g. a name-request trigger while the player is operating under an alias):
```javascript
if (check({ type: 'read-boolean', key: 'using_alias' })) { skip = true }
```

## Authoring patterns

Worked trigger recipes. For script-heavy custom mechanics (reputation trackers, status-effect timers, day/night cycles), see [Scripting Patterns](/appendix/scripting-patterns).

### Natural quest discovery (two-step pattern)

**Rule:** Arrival triggers should set the scene and write a boolean flag. A separate `discover_*` trigger should fire `quest-init` - but only after the player has actually encountered the quest hook through play.

**The problem with single-step arrival triggers:** If `quest-init` fires the moment the player arrives at a location, the quest appears in their journal before they have exchanged a single word with the quest-giver. It breaks immersion and makes the world feel scripted.

**The two-step solution:**

| Trigger | Conditions | Effects |
|---|---|---|
| `start_[location]` | `party-location` + `tick > 0` | `story` (scene-setting) + `write-boolean` flag = true |
| `discover_[quest_slug]` | `read-boolean` (flag) + `story` (AI query) | `quest-init` |

Step 1 fires when the player arrives and sets the stage. Step 2 only fires once the AI confirms the player has spoken with the relevant NPC, witnessed the crisis, or otherwise encountered the hook organically in the fiction.

**`story` condition query** - write it as a plain English question describing what "has been discovered." Examples:

- `"The player has spoken with the archivist or been told about the missing documents"`
- `"The player has observed the creature claiming the cavern approach as territory"`
- `"The injured survivor has made contact and shared their account of what happened"`

Keep queries specific enough that false positives are unlikely. The `story` condition matches against session history - vague queries produce false positives.

**`recurring: false`** on both triggers. They should each fire once.

**For quest chains:** Use `quests-completed contains "Quest Name"` as the condition. Add a tick gate (`tick > 1`) to avoid same-turn chain firing.

**Starting zone NPC placement:**

**1. `startingQuests` field:** Must be `[]` on every story start - this injects authored quest names directly at session open, bypassing the trigger system entirely.

**2. No character NPCs in starting zones:** Keep named story NPCs out of the `locationAreas` opening zone. Place them in a different area of the same location so they are findable once the player moves.

**3. NPC `paths` adjacency bleed:** Starting zone outgoing `paths` must not include areas containing character NPCs.

**4. NPC `basicInfo` area accuracy:** `basicInfo` must only name the NPC's actual `currentArea`, or no area.

**5. Shared `currentLocation`:** For full isolation from a starting scene, move the NPC to a different `currentLocation`. Shared location + different area is not a guarantee of separation.

**Naming convention:**

Use `snake_case` throughout — all lowercase, words separated by underscores. Space-separated names work but produce ugly output in logs and are inconsistent with the rest of the schema.

| Trigger key pattern | Purpose |
|---|---|
| `[location]_init` or `start_[location]` | First arrival at a location (tick > 0); sets scene + boolean flag |
| `arrive_[location]_*` | Subsequent arrivals at same location (tick > 3, tick > 5); sets additional flags |
| `[quest]_quest_init` or `discover_[quest_slug]` | Story-condition trigger; fires `quest-init` when hook is encountered |
| `[quest]_chain_N` or `chain_[quest_slug]` | `quests-completed` chain trigger; numbered suffix for multi-step chains |
| `[quest]_complete` | Fires when a quest chain reaches its conclusion; writes a completion flag |
| `[system]_init` | Tick-0 or tick-1 trigger that initializes counters and booleans for an ongoing system |
| `[system]_counter` | Recurring trigger that increments a number each turn a condition is met |
```json
{
  "start_the_capital": {
    "name": "start_the_capital",
    "recurring": false,
    "conditions": [
      { "type": "party-location", "operator": "equals", "value": "The Capital" },
      { "type": "game-tick", "operator": "greaterThan", "value": 0 }
    ],
    "effects": [
      {
        "type": "story",
        "instruction": "The player arrives in the capital. Establish the political atmosphere - the council's competing agendas, the guild's visible presence, and an undercurrent of unease about certain facts being kept quiet. Introduce the possibility of encountering the archivist early."
      },
      { "type": "write-boolean", "key": "arrived_the_capital", "operator": "set", "value": true }
    ]
  },
  "discover_missing_documents": {
    "name": "discover_missing_documents",
    "recurring": false,
    "conditions": [
      { "type": "read-boolean", "key": "arrived_the_capital", "operator": "equals", "value": true },
      { "type": "story", "query": "The player has spoken with the archivist or been told about the missing documents" }
    ],
    "effects": [
      { "type": "quest-init", "operator": "set", "value": "The Missing Documents" }
    ]
  }
}
```

**This is the two-step quest discovery pattern.** The arrival trigger (`start_the_capital`) sets the scene and writes a boolean flag - it does **not** fire `quest-init`. A separate trigger (`discover_missing_documents`) watches for the flag and uses a `story` condition to ask the AI: "has the player actually encountered the quest hook?" Only when both are true does the quest become available. The result: quests surface naturally from conversation and exploration instead of landing in the player's lap the moment they step through a door.

The `game-tick > 0` on the arrival trigger prevents it firing at tick 0 when the story starts at that location, giving the opening scene room to breathe. The `story` effect reads like brief director's notes to the AI - set tone, name the relevant NPC, point toward the hook. Keep these short; they inject into a single turn.

**`quest-init` should almost always be paired with a `story` effect.** The `quest-init` effect makes the quest mechanically available, but without a `story` effect on the same trigger, the player will see a quest card appear with no narrative lead-in. Use the `story` effect to deliver the scene beat that explains why the quest just surfaced.

**Persistent nudge variant.** If the hook might not naturally come up on the turn the player arrives, use a `recurring: true` prompt trigger instead of `recurring: false`. Add a `quests-completed notContains "Quest Name"` condition as a stop guard so it stops nudging once the quest is discovered.

---

### Counter and threshold pattern

For systems that accumulate over time — reputation, renown, training progress, faction pressure — a three-trigger architecture is the standard pattern:

1. **Init trigger** (`recurring: false`, `game-tick equals 1`): sets the counter to 0 at session start
2. **Increment trigger** (`recurring: true`, condition = event that should increment): runs `write-number add 1` each time the event occurs  
3. **Threshold trigger** (`recurring: false`, `read-number greaterThanOrEqual N`): fires the consequence when the counter reaches the target

```json
{
  "renown_init": {
    "name": "renown_init",
    "recurring": false,
    "conditions": [
      { "type": "game-tick", "operator": "equals", "value": 1 }
    ],
    "effects": [
      { "type": "write-number", "key": "renown_score", "operator": "set", "value": 0 }
    ]
  },
  "renown_increase": {
    "name": "renown_increase",
    "recurring": true,
    "conditions": [
      { "type": "story", "query": "The player completed a notable deed or was publicly recognised for an achievement" },
      { "type": "read-number", "key": "renown_score", "operator": "lessThan", "value": 3 }
    ],
    "effects": [
      { "type": "write-number", "key": "renown_score", "operator": "add", "value": 1 }
    ]
  },
  "renown_tier_1": {
    "name": "renown_tier_1",
    "recurring": false,
    "conditions": [
      { "type": "read-number", "key": "renown_score", "operator": "greaterThanOrEqual", "value": 1 },
      { "type": "player-traits", "operator": "notContains", "value": "Known Figure" }
    ],
    "effects": [
      { "type": "player-traits", "operator": "add", "value": "Known Figure" },
      { "type": "story", "instruction": "The player has begun to develop a reputation. NPCs who would plausibly have heard of their deeds now recognise the name." }
    ]
  }
}
```

The `read-number lessThan 3` guard on the increment trigger prevents the counter running beyond its useful range. The `player-traits notContains` guard on the threshold trigger prevents the trait being added twice if the trigger somehow evaluates more than once. Both guards are standard practice.

**Resetting variant.** For systems that should fire periodically rather than once, add a fourth trigger that resets the counter after the threshold fires: `read-number greaterThanOrEqual N` → `write-number set 0`. This turns "fires once when N is reached" into "fires every time N accumulates."

---

### Reactive story response (recurring)

The simplest useful recurring trigger carries no flags, counters, or quests at all: a `story` condition watches for something the player does in the fiction, and a `story` effect tells the narrator how to react. Because it is `recurring: true` and stateless, it fires every time the condition matches, for the whole session - the right shape for a "whenever the player does X, the world reacts with Y" behaviour the narrator tends to forget or handle inconsistently.

This example makes NPCs answer the player's text messages, a behaviour the narrator does not reliably produce on its own:

```json
{
  "cell_phone_text_response": {
    "name": "cell_phone_text_response",
    "recurring": true,
    "conditions": [
      {
        "type": "story",
        "query": "The player character sends a text message, SMS, or cell phone message to someone"
      }
    ],
    "effects": [
      {
        "type": "story",
        "instruction": "The recipient of the text message sends a response. The response should be in character for the NPC, reflecting their personality, current mood, and relationship with the sender. The response arrives after a delay appropriate to the character — some reply instantly, others take their time. Include the message content naturally in the narration."
      }
    ]
  }
}
```

**Why it works.** The `story` condition is phrased with synonyms ("text message, SMS, or cell phone message") so semantic matching catches the action however the player writes it. The `story` effect reads as director's notes - it sets the behaviour (NPC replies in character, after a realistic delay) without scripting the content, leaving the narrator to author the actual reply. No `write-boolean` flag is used because the trigger is meant to fire repeatedly rather than once.

**Adding a guard.** If the reaction should happen only once, or should stop after some point, add a guard condition - a `read-boolean` flag, a `quests-completed` check, or a counter - exactly as in the two patterns above. Stateless recurring is only correct when the reaction genuinely should recur every time.

### Common patterns

- **Session initialization (tick 0)** - `game-tick equals 0`, `recurring: false` → fires exactly once at game start. Use for setting initial storage values and write-boolean flags. **Do not use a `story` effect here** - a story instruction at tick 0 does not affect the initial scene (use `storyStart` text or a tick 1+ trigger instead). If a broader early-game window is needed, use `game-tick lessThanOrEqual N` instead.
- **Natural quest discovery (two-step)** - Step 1: arrival trigger sets scene + `write-boolean` flag. Step 2: a separate trigger checks `read-boolean` (flag) + `story` (AI evaluates whether the player has spoken with the quest-giver or witnessed the hook) → fires `quest-init`. Quests feel earned rather than handed out. Use this pattern when you need state persistence between events - not simply for performance.
- **Simple gate** - `recurring: false`, one location/region condition, one `story` effect. Fires once on arrival to set the scene.
- **Action-response blocker** - `action-text` regex matches a forbidden or tutorial action → `story` effect redirects or blocks. `recurring: true` if the block should persist; `recurring: false` for a one-time tutorial. Evaluates in the planning phase, so the response is immediate.
- **Gate plus counter increment** - a gate trigger sets a `write-boolean` to true; a second `recurring: true` trigger reads that boolean + any other condition → `write-number` add 1. A third trigger reads the counter at a threshold → fires the main effect and optionally resets the counter.
- **Threshold or escalation** - `read-number` greaterThanOrEqual threshold → fires an escalation effect (quest-init, story note, trait change). Chain multiple thresholds at different values for multi-stage escalation.
- **Counter** - three triggers: (1) gate sets counter to 0, (2) `recurring: true` increment reads gate + `story` condition, (3) threshold trigger reads counter value and fires effect.
- **State machine** - `write-string` sets state ("inactive"/"active"/"completed"), `read-string` checks state in subsequent triggers.
- **Semantic gate** - use a cheap `story-text` regex as a gate (`write-boolean` → true), then add `read-boolean` as first condition on the expensive `story` AI condition to avoid re-evaluating it every turn.
- **Quest chain** - `quests-completed contains "Quest A"` as condition → `quest-init` effect for "Quest B".

### Realm travel

*Pattern credit: Sephii (Discord)*

> **⚠️ Warning:** `action-text` (regex) conditions do not fire realm travel triggers. Use `action` (AI semantic) conditions only.

Three methods are available. Method 1 is the recommended approach -- use it as the foundation for any multi-realm world. Method 2 handles narrative transport moments at specific portal [locations](/world/locations). Method 3 scales Method 2 to many portals via a single trigger.

#### Method 1 -- Intent override + realm_sync (recommended)

> **📋 Note:** Recommended approach -- keeps `party-realm` accurate regardless of how the party moved.

Two parts that work in conjunction:

**Part A -- Cross-realm travel intent override (aiInstructions)**

The engine's travel intent resolver does not automatically include a `realm` field when the player navigates to a different realm. Without it, cross-realm travel silently targets the wrong realm or fails. Fixing this requires an explicit override in `aiInstructions` -- typically in a custom subkey -- that instructs the AI to include `realm` in the intents-target output for cross-realm destinations only.

Place the following block (adapted to your realm names and entry points) inside an `aiInstructions` subkey:

```text
### CRITICAL INTENTS-TARGET OVERRIDE ###
When a player's travel, teleport, or fastTravel intent targets a destination in a DIFFERENT realm than Current Realm,
you MUST add a "realm" field to the intents-target JSON output. Use the exact realm name from
possibleMapHierarchyMatches Realms. Do NOT omit the realm field for cross-realm travel.
Do NOT include it for same-realm travel.

The intents-target output shape for cross-realm travel is: {"realm":"string","region":"string"}.

Cross-realm default entry points (these are REGIONS, not locations):
- RealmA: region "Entry Region A"
- RealmB: region "Entry Region B"

When no specific destination is named within the target realm, use the entry point region.
Do NOT invent region, location, or area names not listed here or in the travel context.

Examples of correct intents-target output:
- Cross-realm, no specific destination: {"realm":"RealmB","region":"Entry Region B"}
- Same-realm travel: {"region":"Ironreach"} (no realm field)
### END OVERRIDE ###
```

> The override uses directive casing (`MUST`, `Do NOT`) because the intent resolver runs under a different context than the narrator -- softer language is frequently ignored. Include exact entry-point region names, not location names; the engine resolves region-level targets correctly but does not accept invented names.

**Part B -- realm_sync background repair**

Even with the intent override in place, `party-realm` can drift out of sync with the actual region if the player is moved by trigger or if the intent resolver misses a case. A background recurring trigger with no conditions corrects this silently every turn:

```json
"realm_sync": {
  "name": "realm_sync",
  "recurring": true,
  "conditions": [],
  "script": "var realm = check({ type: 'party-realm' })\nvar region = check({ type: 'party-region' })\nvar expected = 'RealmA'\nif (/^RealmB/.test(region)) {\n  expected = 'RealmB'\n} else if (/^RealmC/.test(region)) {\n  expected = 'RealmC'\n}\nif (realm !== expected) {\n  effects.push({ type: 'party-realm', operator: 'set', value: expected })\n} else {\n  skip = true\n}",
  "effects": []
}
```

The script derives the expected realm from the region name using a prefix regex. If `party-realm` already matches, `skip = true` prevents a no-op effect from being pushed every turn. Adapt the regex patterns and realm names to match your world.

> **Why both parts are needed:** The intent override fixes new travel intents. `realm_sync` repairs state that was already wrong -- from trigger-driven movement, session restore edge cases, or intent override misses. Together they keep `party-realm` accurate regardless of how the party moved.

#### Method 2 -- Two-trigger portal (narrative transport)

Use this for specific portal locations where you want a two-turn narrated activation before the transport fires.

Realm travel requires two triggers working in sequence.

**Trigger 1 - Queue** (`portal_queue`): detects the activation gesture and arms the transport.

- Conditions: `party-location` + `party-area` + `action` (semantic check: did the player perform this exact gesture?)
- Effects: `write-boolean` flag → true, then `story` narrating the activation moment
- The `action` query must describe the exact physical gesture only - not the player's intent. Vague queries produce false positives.

**Trigger 2 - Transport** (`portal_transport`): fires the following turn once the flag is set.

- Conditions: `read-boolean` flag = true + same `party-location` + `party-area`
- Effects: `write-boolean` flag → false, then `party-realm` + `party-region` + `party-location` set to destination, then `story` narrating arrival

The boolean flag is the critical intermediary. It gives the engine one full turn to narrate the activation before the teleport fires, preventing both triggers from collapsing into the same turn.

> **📋 Note:** The transition may cause visible state-loading artifacts - parts of the new state loading in while the old state is still partially active. This is a known side effect of the two-turn sequence, not a sign of a broken setup. It resolves on its own once the second trigger completes.

```json
"portal_queue": {
  "name": "portal_queue",
  "recurring": true,
  "conditions": [
    { "type": "party-location", "operator": "equals", "value": "Location Name" },
    { "type": "party-area", "operator": "equals", "value": "Area Name" },
    { "type": "action", "query": "Player performs the specific activation gesture. Describe the exact physical action only — intent does not count." }
  ],
  "effects": [
    { "type": "write-boolean", "key": "transportFlag", "operator": "set", "value": true },
    { "type": "story", "instruction": "Describe the moment of activation — nothing happens yet. Reactions of bystanders." }
  ]
},
"portal_transport": {
  "name": "portal_transport",
  "recurring": true,
  "conditions": [
    { "type": "read-boolean", "key": "transportFlag", "operator": "equals", "value": true },
    { "type": "party-location", "operator": "equals", "value": "Location Name" },
    { "type": "party-area", "operator": "equals", "value": "Area Name" }
  ],
  "effects": [
    { "type": "write-boolean", "key": "transportFlag", "operator": "set", "value": false },
    { "type": "party-realm", "operator": "set", "value": "Destination Realm" },
    { "type": "party-region", "operator": "set", "value": "Destination Region" },
    { "type": "party-location", "operator": "set", "value": "Destination Location" },
    { "type": "story", "instruction": "Describe the transport and arrival at the destination." }
  ]
}
```

#### Method 3 -- Route-map (multiple portals)

A single recurring trigger handles any number of portals, with optional bidirectional support. Use `action` conditions only - `action-text` (regex) does not fire realm travel triggers.

```javascript
const curRealm    = check({ type: 'party-realm' })
const curLocation = check({ type: 'party-location' })
const curArea     = check({ type: 'party-area' })

const routes = [
  {
    from: { realm: 'RealmA', location: 'LocationA', area: 'AreaA' },
    to:   { realm: 'RealmB', location: 'LocationB', area: 'AreaB' },
    bidirectional: true
  },
  {
    from: { realm: 'RealmA', location: 'LocationC', area: 'AreaC' },
    to:   { realm: 'RealmC', location: 'LocationD', area: 'AreaD' },
    bidirectional: false
  }
]

const at = (pos) =>
  pos.realm === curRealm &&
  pos.location === curLocation &&
  pos.area === curArea

let destination = null
for (const route of routes) {
  if (at(route.from))                      { destination = route.to;   break }
  if (route.bidirectional && at(route.to)) { destination = route.from; break }
}

if (!destination) {
  skip = true
  log('no route matched: ' + curRealm + '/' + curLocation + '/' + curArea)
} else {
  effects.push({ type: 'party-realm',    operator: 'set', value: destination.realm    })
  effects.push({ type: 'party-location', operator: 'set', value: destination.location })
  effects.push({ type: 'party-area',     operator: 'set', value: destination.area     })
  log('travel: ' + curLocation + '/' + curArea + ' -> ' + destination.location + '/' + destination.area)
}
```

### Race evolution

Permanently swap one race trait for another and deliver the transformation as a present-tense scene interrupt. Uses the same two-turn split as realm travel: the swap fires first, and the narrator describes it the following turn against the already-updated character state.

Both triggers are one-shot and self-delete via script. The `race_evolved` flag is the permanent record; `race_evolution_narrate` is the one-turn delivery signal.

Adapt the conditions to whatever gates the evolution in your world (level threshold, quest completed, resource milestone, narrative flag, or any combination).

```json
"race_evolution_swap": {
  "name": "race_evolution_swap",
  "conditions": [
    { "type": "player-level", "operator": "greaterThanOrEqual", "value": 10 },
    { "type": "quests-completed", "operator": "contains", "value": "Trial of the Ashen Flame" },
    { "type": "read-boolean", "key": "race_evolved", "operator": "equals", "value": false }
  ],
  "effects": [
    { "type": "player-traits", "operator": "remove", "value": "Human" },
    { "type": "player-traits", "operator": "add", "value": "Ashborn" },
    { "type": "write-boolean", "key": "race_evolved", "operator": "set", "value": true },
    { "type": "write-boolean", "key": "race_evolution_narrate", "operator": "set", "value": true }
  ],
  "script": "delete triggers['race_evolution_swap'];"
},
"race_evolution_narrate": {
  "name": "race_evolution_narrate",
  "conditions": [
    { "type": "read-boolean", "key": "race_evolution_narrate", "operator": "equals", "value": true }
  ],
  "effects": [
    { "type": "story", "instruction": "The character has just permanently transformed into an Ashborn. Interrupt the current scene to describe the physical change unfolding: ash-grey skin, ember light behind the eyes, the faint smell of spent flame. Make it visceral and present-tense; the character feels it happening. This is not a background event, it is the scene. After the transformation is complete, continue from where the story was." }
  ],
  "script": "delete triggers['race_evolution_narrate'];"
}
```

#### Race evolution -- branching paths (player choice)

For worlds where multiple evolution paths exist and the player selects one at the threshold, a single universal selector trigger handles all branches. No separate trigger per path is needed; the script does the routing.

Three triggers: a gate that presents the choice, a universal selector that reads the player's input and applies the correct swap, and the narration delivery.

**Trigger 1 -- present choice** (one-shot, state phase):

```json
"race_evolution_gate": {
  "name": "race_evolution_gate",
  "conditions": [
    { "type": "player-level", "operator": "greaterThanOrEqual", "value": 10 },
    { "type": "read-boolean", "key": "race_evolved", "operator": "equals", "value": false },
    { "type": "read-boolean", "key": "evolution_pending", "operator": "equals", "value": false }
  ],
  "effects": [
    { "type": "write-boolean", "key": "evolution_pending", "operator": "set", "value": true },
    { "type": "story", "instruction": "Pause the scene. Tell the player their character has reached the threshold of transformation and must now choose a path. Present the options clearly: Ashborn (fire and ash), Frostborn (cold and stillness), Stormborn (lightning and motion). Wait for their choice before continuing." }
  ],
  "script": "delete triggers['race_evolution_gate'];"
}
```

**Trigger 2 -- universal selector** (recurring, planning phase):

```json
"race_evolution_select": {
  "name": "race_evolution_select",
  "recurring": true,
  "conditions": [
    { "type": "read-boolean", "key": "evolution_pending", "operator": "equals", "value": true },
    { "type": "action", "query": "The player has chosen one of the available evolution paths by name or clear intent." }
  ],
  "effects": [],
  "script": "const input = (check({ type: 'action-text' }) || []).slice(-1)[0] || '';\nconst paths = {\n  'ashborn':   'Ashborn',\n  'frostborn': 'Frostborn',\n  'stormborn': 'Stormborn',\n};\nconst chosen = Object.entries(paths).find(([key]) => new RegExp(key, 'i').test(input));\nif (chosen) {\n  effects.push({ type: 'player-traits', operator: 'remove', value: 'Human' });\n  effects.push({ type: 'player-traits', operator: 'add', value: chosen[1] });\n  effects.push({ type: 'write-boolean', key: 'evolution_pending', operator: 'set', value: false });\n  effects.push({ type: 'write-boolean', key: 'race_evolved', operator: 'set', value: true });\n  effects.push({ type: 'write-boolean', key: 'race_evolution_narrate', operator: 'set', value: true });\n  delete triggers['race_evolution_select'];\n} else {\n  skip = true;\n}"
}
```

The `action` semantic condition routes this trigger to the planning phase so the response is immediate. If the player's input does not match any path, `skip = true` prevents the trigger from consuming itself and it retries next turn. Adding a new evolution path requires only a new entry in the `paths` object.

> **📋 Note:** The `action` semantic condition is intentionally broad -- it fires whenever the AI judges that a choice was made, and the script's regex is the real gate. If the AI fires the trigger on ambiguous input but no regex key matches, `skip = true` is set and the turn passes silently with no visible effect. This is harmless in practice, but keep the regex keys specific enough that a clear player choice always produces a match.

**Trigger 3 -- narration delivery** (one-shot, state phase): identical to the single-path version above. The `story` instruction should reference the chosen form by name; since the swap has already applied, the character sheet reflects the new race and the narrator can read it directly. A generic instruction works:

```json
"race_evolution_narrate": {
  "name": "race_evolution_narrate",
  "conditions": [
    { "type": "read-boolean", "key": "race_evolution_narrate", "operator": "equals", "value": true }
  ],
  "effects": [
    { "type": "story", "instruction": "The character has just permanently transformed into their chosen evolved form. Interrupt the current scene to describe the physical change as it happens -- draw from the character sheet to name the new race and shape the sensory details accordingly. Make it visceral and present-tense; the character feels it happening. This is not a background event, it is the scene. After the transformation is complete, continue from where the story was." }
  ],
  "script": "delete triggers['race_evolution_narrate'];"
}
```
