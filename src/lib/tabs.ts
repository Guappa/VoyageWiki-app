export interface TabInfo { title: string; lede: string; }

export const TAB_INFO: Record<string, TabInfo> = {
  world: {
    title: "World",
    lede: "The people and places that populate your scenario. Story overview, world lore, NPCs, locations, regions, story starts, items, factions, quests, and realms."
  },
  mechanics: {
    title: "Mechanics",
    lede: "How characters act and grow. Attributes, resources, skills, traits, abilities, triggers, item settings, combat settings, and death rules."
  },
  ai: {
    title: "AI",
    lede: "Narrator instruction blocks. Story Instructions covers all fifteen narrator tasks - Story, Initial Start, NPC Details, NPC Intents, and more - that shape how the AI narrates."
  },
  other: {
    title: "Other",
    lede: "Narrator style, name filter settings, and runtime tools the narrator can call through in-game chat."
  },
  mods: {
    title: "Mods",
    lede: "Partial world JSON layered onto a host scenario. Same editor and schema as world authoring, with no required sections."
  },
  appendix: {
    title: "Appendix",
    lede: "Cross-cutting reference material. Scripting patterns, validation reference, narrative authoring guidance, editorial review checklist, and the voice catalog."
  },
  "getting-started": {
    title: "Getting Started",
    lede: "Orientation pages for new authors. Editor UI layout, the io-ts schema validator, and the hard size caps the editor enforces."
  }
};
