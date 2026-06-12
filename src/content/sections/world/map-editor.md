---
tab: "world"
section: "map-editor"
title: "Map Editor"
kind: "guide"
summary: "The Map Editor is a visual canvas accessible from the **Regions** and **Locations** sidebar items. It's the fastest way to build the world map - you don't have to touch JSON for placement at all."
order: 90
advanced: false
---

The Map Editor is a visual canvas accessible from the **Regions** and **Locations** sidebar items. It's the fastest way to build the world map - you don't have to touch JSON for placement at all.

**How it works:**

- **Click an empty cell** on the canvas → creates a new region at that grid position. A side panel opens on the right with NAME, X, Y, KNOWN toggle, Basic Info textarea, Hidden Info collapsible, and a Locations list.
- **Click inside an existing region** → creates a new location pinned inside that region. The side panel switches to show the location's fields (NAME, X, Y, RADIUS, KNOWN, Basic Info, Hidden Info, Complexity Type).
- **Click an existing region or location pin** → opens its side panel for editing without creating anything new.

**What you can do entirely in the Map Editor:**

- Create and name all [regions](/world/regions) and [locations](/world/locations)
- Set coordinates (X/Y) by clicking placement - you don't need to know the coordinate values manually
- Write Basic Info and Hidden Info for every region and location
- Toggle KNOWN on/off
- See which locations already exist in each region (the Locations list at the bottom of the region panel)

**What still requires JSON:**

- Adding [`factions`](/world/factions), `areas`, `paths`, `realm` assignments to locations
- Setting `complexityType`, `detailType`, `radius` beyond the defaults
- Any bulk editing or copying of entries

**Recommended workflow:** Use the Map Editor to lay out the full geography first - place all regions, set names and Basic Info, pin all locations. Export the JSON, then enrich each entry with factions, areas, and hidden info in the text editor. This way you're never fighting coordinate math manually and the visual layout is confirmed before you write the prose.