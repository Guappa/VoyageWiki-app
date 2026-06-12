<script lang="ts">
  import { SvelteFlow, Background, BackgroundVariant, Controls, ControlButton, MiniMap } from "@xyflow/svelte";
  import { tick } from "svelte";
  import "@xyflow/svelte/dist/style.css";
  import { parseWorld } from "~/lib/trigger-map/parse-world";
  import { layout } from "~/lib/trigger-map/layout";
  import { forceLayout } from "~/lib/trigger-map/force-layout";
  import { layeredLayout } from "~/lib/trigger-map/layered-layout";
  import { buildTriggerGraph } from "~/lib/trigger-map/trigger-graph";
  import type { TriggerGraph } from "~/lib/trigger-map/trigger-graph";
  import { dependencyLayout } from "~/lib/trigger-map/dependency-layout";
  import { toDependencyFlow } from "~/lib/trigger-map/to-dependency-flow";
  import { seedPositions, resolvePosition } from "~/lib/trigger-map/positions";
  import { toFlow } from "~/lib/trigger-map/to-flow";
  import type { GraphModel } from "~/lib/trigger-map/types";
  import { addStructuredRef, removeStructuredRef, relationChoicesForKind, updateStructuredEntry, removeEntryAt, appendEntry, setRecurring, renameTrigger as renameTriggerInWorld } from "~/lib/trigger-map/authoring";
  import type { RelationChoice } from "~/lib/trigger-map/authoring";
  import NodeInspector from "~/components/islands/trigger-map/NodeInspector.svelte";
  import RelationPicker from "~/components/islands/trigger-map/RelationPicker.svelte";
  import ValidationStatus from "~/components/islands/trigger-map/ValidationStatus.svelte";
  import FlowApi from "~/components/islands/trigger-map/FlowApi.svelte";
  import ContextMenu from "~/components/islands/trigger-map/ContextMenu.svelte";
  import type { ContextItem } from "~/components/islands/trigger-map/ContextMenu.svelte";
  import TocNavigator from "~/components/islands/trigger-map/TocNavigator.svelte";
  import FilterBar from "~/components/islands/trigger-map/FilterBar.svelte";
  import ResizeHandle from "~/components/islands/trigger-map/ResizeHandle.svelte";
  import MapLegend from "~/components/islands/trigger-map/MapLegend.svelte";
  import type { NodeKind } from "~/lib/trigger-map/types";
  import { validateWorld } from "~/lib/validator";
  import type { ValidationResult } from "~/lib/validator";
  import { serializeWorld } from "~/lib/trigger-map/serialize";
  import { nodeId, isTriggerId, triggerKeyFromId } from "~/lib/trigger-map/types";

  // Offset applied when placing a duplicate or freshly-spawned node near its source.
  const SPAWN_OFFSET = { x: 40, y: 80 };

  interface ContextMenuState {
    x: number;
    y: number;
    items: ContextItem[];
  }

  // A connection awaiting the user's relation choice for an ambiguous target.
  interface PendingConnect {
    triggerName: string;
    targetKey: string;
    choices: RelationChoice[];
    x: number;
    y: number;
  }

  let world = $state<unknown>(null);
  // Deep-proxied $state trips Svelte Flow's large-collection performance warning.
  let nodes = $state.raw<any[]>([]);
  let edges = $state.raw<any[]>([]);
  let error = $state("");
  let model = $state<GraphModel | null>(null);
  let selectedNodeId = $state<string | null>(null);
  let pendingConnect = $state<PendingConnect | null>(null);
  let validation = $state<ValidationResult | null>(null);
  let uploadedName = $state("world.json");
  let chosenName = $state("");
  // Bumped on each fresh world load to remount Svelte Flow so its viewport re-fits.
  let loadId = $state(0);
  // Source of truth for node positions; persists across rebuilds so drags are not lost.
  let positionStore = new Map<string, { x: number; y: number }>();
  let flowApi = $state<any>(null);
  let contextMenu = $state<ContextMenuState | null>(null);
  let fullscreen = $state(false);
  let tocOpen = $state(false);
  let hiddenKinds = $state<Set<NodeKind>>(new Set());
  let hideScriptEdges = $state(false);

  // Capped so undo history can't grow without bound over a long session.
  const UNDO_LIMIT = 30;
  let undoStack: Array<{ world: string; positions: Map<string, { x: number; y: number }> }> = [];
  let canUndo = $state(false);

  let layoutMode = $state<"force" | "layered">(loadLayoutMode());
  let viewMode = $state<"graph" | "dependency">(loadViewMode());
  // Cached so the selection-highlight effect can recompute dependency edges without re-running dagre.
  let lastTriggerGraph: TriggerGraph | null = null;
  let dependencyPositions = new Map<string, { x: number; y: number }>();

  const TOC_MIN = 140, TOC_MAX = 480, INSPECTOR_MIN = 280, INSPECTOR_MAX = 680;
  let tocWidth = $state(loadStoredWidth("tm-toc-width", 200, TOC_MIN, TOC_MAX));
  let inspectorWidth = $state(loadStoredWidth("tm-inspector-width", 420, INSPECTOR_MIN, INSPECTOR_MAX));

  let canvasEl = $state<HTMLElement | null>(null);

  // Track the most recent pointer position so the picker appears near the drop point.
  let lastPointerX = 0;
  let lastPointerY = 0;

  // Single cast site so callers stop sprinkling `world as ...` at each mutation point.
  function worldRecord(): Record<string, unknown> {
    return world as Record<string, unknown>;
  }

  function triggersDict(): Record<string, any> {
    return (world as any)?.triggers ?? {};
  }

  function applyAutoLayout() {
    const layout = layoutMode === "layered" ? layeredLayout : forceLayout;
    positionStore = seedPositions(layout(parseWorld(world)));
  }

  function loadLayoutMode(): "force" | "layered" {
    if (typeof localStorage === "undefined") return "force";
    return localStorage.getItem("tm-layout-mode") === "layered" ? "layered" : "force";
  }

  function loadViewMode(): "graph" | "dependency" {
    if (typeof localStorage === "undefined") return "graph";
    return localStorage.getItem("tm-view-mode") === "dependency" ? "dependency" : "graph";
  }

  function toggleLayout() {
    layoutMode = layoutMode === "force" ? "layered" : "force";
    if (typeof localStorage !== "undefined") localStorage.setItem("tm-layout-mode", layoutMode);
    if (!world) return;
    applyAutoLayout();
    rebuild(false);
    // Remount so the flow re-fits to the new arrangement.
    loadId++;
  }

  function toggleView() {
    viewMode = viewMode === "graph" ? "dependency" : "graph";
    if (typeof localStorage !== "undefined") localStorage.setItem("tm-view-mode", viewMode);
    if (!world) return;
    rebuild(false);
    loadId++;
  }

  function rebuild(snapshotCurrent = true) {
    if (!world) return;
    const graph = parseWorld(world);
    model = graph;
    if (viewMode === "dependency") {
      rebuildDependency(graph);
    } else {
      rebuildGraph(graph, snapshotCurrent);
    }
    // Never let a transiently-invalid mid-edit world crash the editor.
    try {
      validation = validateWorld(world);
    } catch {
      validation = null;
    }
  }

  function rebuildGraph(graph: GraphModel, snapshotCurrent: boolean) {
    // Skip the drag-snapshot right after a fresh layout, or it overwrites the new positions.
    if (snapshotCurrent) {
      for (const n of nodes) positionStore.set(n.id, { x: n.position.x, y: n.position.y });
    }
    for (const node of graph.nodes) {
      const pos = resolvePosition(positionStore, node, graph.edges);
      node.position = pos;
      positionStore.set(node.id, pos);
    }
    const { flowNodes, flowEdges } = toFlow(graph, { hiddenKinds, hideScriptEdges, selectedId: selectedNodeId });
    // Re-mark selection so a rebuild doesn't clear it and close the inspector.
    nodes = flowNodes.map((n) => ({ ...n, selected: n.id === selectedNodeId }));
    edges = flowEdges;
  }

  function rebuildDependency(graph: GraphModel) {
    const triggerGraph = buildTriggerGraph(graph, world);
    dependencyPositions = dependencyLayout(triggerGraph);
    lastTriggerGraph = triggerGraph;
    const { flowNodes, flowEdges } = toDependencyFlow(triggerGraph, dependencyPositions, selectedNodeId);
    nodes = flowNodes.map((n) => ({ ...n, selected: n.id === selectedNodeId }));
    edges = flowEdges;
  }

  export function centerNode(id: string) {
    // Read the live node so centering works in whichever view is rendered, not just the entity graph.
    const node = nodes.find((n) => n.id === id) ?? model?.nodes.find((n) => n.id === id);
    if (!node || !flowApi) return;
    flowApi.setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 400 });
  }

  function downloadWorld() {
    if (!world) return;
    const blob = new Blob([serializeWorld(world)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchorElement = document.createElement("a");
    anchorElement.href = url;
    anchorElement.download = uploadedName;
    // Some browsers no-op click() on an anchor that isn't in the DOM.
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
    URL.revokeObjectURL(url);
  }

  function load(text: string) {
    error = "";
    try { world = JSON.parse(text); }
    catch { error = "Invalid JSON"; return; }
    selectedNodeId = null;
    pendingConnect = null;
    undoStack = [];
    canUndo = false;
    applyAutoLayout();
    rebuild(false);
    // Remount so the flow re-fits; a stale viewport leaves a switched world off-screen.
    loadId++;
  }

  function recordSnapshot() {
    if (!world) return;
    undoStack.push({ world: JSON.stringify(world), positions: new Map(positionStore) });
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    canUndo = true;
  }

  // A no-op action shouldn't cost the user an undo step.
  function discardSnapshot() {
    undoStack.pop();
    canUndo = undoStack.length > 0;
  }

  function undo() {
    const snapshot = undoStack.pop();
    if (!snapshot) return;
    world = JSON.parse(snapshot.world);
    positionStore = snapshot.positions;
    selectedNodeId = null;
    pendingConnect = null;
    rebuild();
    loadId++;
    canUndo = undoStack.length > 0;
  }

  function loadStoredWidth(key: string, fallback: number, min: number, max: number): number {
    if (typeof localStorage === "undefined") return fallback;
    const stored = Number(localStorage.getItem(key));
    return Number.isFinite(stored) && stored > 0 ? Math.min(max, Math.max(min, stored)) : fallback;
  }

  function resizeToc(deltaX: number) {
    tocWidth = Math.min(TOC_MAX, Math.max(TOC_MIN, tocWidth + deltaX));
  }

  // The inspector handle sits on the panel's left edge, so dragging right shrinks it.
  function resizeInspector(deltaX: number) {
    inspectorWidth = Math.min(INSPECTOR_MAX, Math.max(INSPECTOR_MIN, inspectorWidth - deltaX));
  }

  function persistWidths() {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem("tm-toc-width", String(tocWidth));
    localStorage.setItem("tm-inspector-width", String(inspectorWidth));
  }

  // Let native/CodeMirror undo win while editing text; only the canvas uses our history.
  function isEditableTarget(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    if (!element) return false;
    const tag = element.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || element.isContentEditable || !!element.closest?.(".cm-editor");
  }

  async function onFile(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    chosenName = file.name;
    try {
      load(await file.text());
      // Keep the previous name on parse failure, the world didn't change.
      if (!error) uploadedName = file.name;
    } catch (err) {
      error = "Could not read file: " + (err as Error).message;
    }
  }

  function canvasRelative(clientX: number, clientY: number): { x: number; y: number } {
    const rect = canvasEl?.getBoundingClientRect();
    return { x: rect ? clientX - rect.left : clientX, y: rect ? clientY - rect.top : clientY };
  }

  // Generate a trigger key that does not collide with existing keys.
  function uniqueTriggerName(base: string): string {
    const triggers = triggersDict();
    if (!triggers[base]) return base;
    let suffix = 2;
    while (triggers[`${base}_${suffix}`]) suffix++;
    return `${base}_${suffix}`;
  }

  function addTriggerAt(clientX: number, clientY: number) {
    if (!world || !flowApi) return;
    recordSnapshot();
    const name = uniqueTriggerName("new_trigger");
    triggersDict()[name] = { name, recurring: false, conditions: [], effects: [], script: "" };
    const flowPos = flowApi.screenToFlowPosition({ x: clientX, y: clientY });
    positionStore.set(nodeId("trigger", name), { x: flowPos.x, y: flowPos.y });
    rebuild();
    selectedNodeId = nodeId("trigger", name);
  }

  // Shared by the context-menu prompt and the inline inspector title; returns false so the caller can revert.
  function applyRename(oldName: string, newName: string): boolean {
    if (!world) return false;
    const trimmed = newName.trim();
    recordSnapshot();
    if (!renameTriggerInWorld(worldRecord(), oldName, trimmed)) { discardSnapshot(); return false; }

    const stored = positionStore.get(nodeId("trigger", oldName));
    if (stored) {
      positionStore.set(nodeId("trigger", trimmed), stored);
      positionStore.delete(nodeId("trigger", oldName));
    }
    rebuild();
    if (selectedNodeId === nodeId("trigger", oldName)) selectedNodeId = nodeId("trigger", trimmed);
    return true;
  }

  function renameTrigger(name: string) {
    const next = prompt("Rename trigger", name);
    if (next == null) return;
    if (!applyRename(name, next) && next.trim() && next.trim() !== name) {
      alert("A trigger with that name already exists.");
    }
  }

  function duplicateTrigger(name: string) {
    if (!world) return;
    recordSnapshot();
    const triggers = triggersDict();
    const copyName = uniqueTriggerName(`${name}_copy`);
    triggers[copyName] = JSON.parse(JSON.stringify(triggers[name]));
    triggers[copyName].name = copyName;
    const source = positionStore.get(nodeId("trigger", name));
    positionStore.set(
      nodeId("trigger", copyName),
      source ? { x: source.x + SPAWN_OFFSET.x, y: source.y + SPAWN_OFFSET.y } : { ...SPAWN_OFFSET },
    );
    rebuild();
    selectedNodeId = nodeId("trigger", copyName);
  }

  function deleteTrigger(name: string) {
    if (!world) return;
    recordSnapshot();
    delete triggersDict()[name];
    if (selectedNodeId === nodeId("trigger", name)) selectedNodeId = null;
    rebuild();
  }

  function openPaneMenu(event: MouseEvent) {
    event.preventDefault();
    const { clientX, clientY } = event;
    const { x, y } = canvasRelative(clientX, clientY);
    contextMenu = {
      x, y,
      items: [
        { label: "Add Trigger here", onclick: () => addTriggerAt(clientX, clientY) },
        { label: "Re-arrange", onclick: () => { applyAutoLayout(); rebuild(false); flowApi?.fitView(); } },
        { label: "Fit view", onclick: () => flowApi?.fitView() },
      ],
    };
  }

  function openNodeMenu(node: any, event: MouseEvent) {
    event.preventDefault();
    const { x, y } = canvasRelative(event.clientX, event.clientY);
    const items: ContextItem[] = [
      { label: "Center", onclick: () => centerNode(node.id) },
    ];
    if (isTriggerId(node.id as string)) {
      const name = triggerKeyFromId(node.id as string);
      items.push(
        { label: "Rename", onclick: () => renameTrigger(name) },
        { label: "Duplicate", onclick: () => duplicateTrigger(name) },
        { label: "Delete trigger", onclick: () => deleteTrigger(name), danger: true },
      );
    }
    contextMenu = { x, y, items };
  }

  // Shared by edge-delete and the edge context menu so both go through the same guards.
  function deleteStructuredEdge(edge: { source: string; target: string; data?: unknown }): boolean {
    if (!world || !model || !isTriggerId(edge.source)) return false;
    const edgeData = edge.data as { relation?: string; origin?: string } | undefined;
    if (edgeData?.origin !== "structured" || !edgeData.relation) return false;
    const targetNode = model.nodes.find((n) => n.id === edge.target);
    if (!targetNode) return false;
    removeStructuredRef(worldRecord(), triggerKeyFromId(edge.source), edgeData.relation, targetNode.key);
    return true;
  }

  function openEdgeMenu(edge: any, event: MouseEvent) {
    event.preventDefault();
    if ((edge.data as { origin?: string } | undefined)?.origin !== "structured") return;
    const { x, y } = canvasRelative(event.clientX, event.clientY);
    contextMenu = {
      x, y,
      items: [
        {
          label: "Delete connection",
          onclick: () => { recordSnapshot(); if (deleteStructuredEdge(edge)) rebuild(); else discardSnapshot(); },
          danger: true,
        },
      ],
    };
  }

  function handleScriptSave(triggerName: string, next: string) {
    const trigger = triggersDict()[triggerName];
    if (!trigger || trigger.script === next) return;
    recordSnapshot();
    trigger.script = next;
    rebuild();
  }

  // Only structured edges from trigger sources are removable; script edges are read-only.
  function handleEdgeDelete(removed: Array<{ source: string; target: string; data?: unknown }>) {
    recordSnapshot();
    let mutated = false;
    for (const edge of removed) {
      if (deleteStructuredEdge(edge)) mutated = true;
    }
    // Avoid a needless rebuild when no structured edge was actually removed.
    if (mutated) rebuild();
    else discardSnapshot();
  }

  function handleConnect(conn: { source: string; target: string }) {
    if (!world || !model || !isTriggerId(conn.source)) return;

    const triggerName = triggerKeyFromId(conn.source);
    const targetNode = model.nodes.find((n) => n.id === conn.target);
    if (!targetNode) return;

    const choices = relationChoicesForKind(targetNode.kind);
    if (choices.length === 0) return;

    if (choices.length === 1) {
      recordSnapshot();
      addStructuredRef(worldRecord(), triggerName, choices[0], targetNode.key);
      rebuild();
      return;
    }

    // Picker sits inside .tm-canvas, so convert the viewport pointer to canvas-relative coords.
    const { x, y } = canvasRelative(lastPointerX, lastPointerY);
    pendingConnect = { triggerName, targetKey: targetNode.key, choices, x, y };
  }

  function handlePickerPick(choice: RelationChoice) {
    if (!pendingConnect || !world) return;
    recordSnapshot();
    addStructuredRef(worldRecord(), pendingConnect.triggerName, choice, pendingConnect.targetKey);
    pendingConnect = null;
    rebuild();
  }

  function handlePickerCancel() {
    pendingConnect = null;
  }

  function handleFilterChange(nextKinds: Set<NodeKind>, nextScriptEdges: boolean) {
    hiddenKinds = nextKinds;
    hideScriptEdges = nextScriptEdges;
    rebuild();
  }

  async function toggleFullscreen() {
    fullscreen = !fullscreen;
    // Re-frame after the DOM resizes so fitView sees the new dimensions.
    await tick();
    flowApi?.fitView();
  }

  // Header keys off this body class; cleanup guards against client-side route changes stranding it.
  $effect(() => {
    document.body.classList.toggle("tm-fullscreen", fullscreen);
    return () => document.body.classList.remove("tm-fullscreen");
  });

  // Svelte still owns the moved node, so the portaled controls stay reactive.
  function portalToHeader(node: HTMLElement) {
    document.querySelector("#tm-header-slot")?.appendChild(node);
    return { destroy() { node.remove(); } };
  }

  // Re-map edge highlights whenever selection changes without a full model rebuild.
  $effect(() => {
    if (!model) return;
    if (viewMode === "dependency") {
      if (!lastTriggerGraph) return;
      edges = toDependencyFlow(lastTriggerGraph, dependencyPositions, selectedNodeId).flowEdges;
    } else {
      edges = toFlow(model, { hiddenKinds, hideScriptEdges, selectedId: selectedNodeId }).flowEdges;
    }
  });
</script>

<svelte:window
  onpointermove={(e) => { lastPointerX = e.clientX; lastPointerY = e.clientY; }}
  onkeydown={(e) => {
    if (e.key === "Escape" && fullscreen) { toggleFullscreen(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !isEditableTarget(e.target)) { e.preventDefault(); undo(); }
  }}
/>

{#snippet mapControls()}
  <button type="button" class="tm-btn" onclick={undo} disabled={!canUndo}>Undo</button>
  <button type="button" class="tm-btn" onclick={toggleView} disabled={!world} title="Graph shows every entity; Dependency shows trigger-to-trigger flow only">
    View: {viewMode === "dependency" ? "Dependency" : "Graph"}
  </button>
  <button type="button" class="tm-btn" onclick={toggleLayout} disabled={!world || viewMode === "dependency"} title="Switch between free-form and layered (triggers on top) arrangement">
    Layout: {layoutMode === "layered" ? "Layered" : "Force"}
  </button>
{/snippet}

{#if fullscreen}
  <div class="tm-header-controls" use:portalToHeader>{@render mapControls()}</div>
{/if}

<div class="tm-toolbar">
  <label class="tm-btn tm-file">
    Choose file
    <input class="tm-file__input" type="file" accept="application/json,.json" onchange={onFile} />
  </label>
  <span class="tm-file__name">{chosenName || "No file chosen"}</span>
  {@render mapControls()}
  <button type="button" class="tm-btn" onclick={downloadWorld} disabled={!world}>Download JSON</button>
  <button type="button" class="tm-btn" onclick={toggleFullscreen}>
    {fullscreen ? "Exit fullscreen" : "Fullscreen"}
  </button>
  {#if world && viewMode === "graph"}
    <FilterBar
      {hiddenKinds}
      {hideScriptEdges}
      onchange={handleFilterChange}
    />
  {/if}
  {#if error}<span class="tm-error">{error}</span>{/if}
  <ValidationStatus {validation} />
</div>
<div class="tm-layout" class:tm--fullscreen={fullscreen}>
  {#if model}
    <div class="tm-toc-wrap" class:tm-toc-wrap--collapsed={!tocOpen} style={tocOpen ? `width: ${tocWidth}px` : ""}>
      {#if tocOpen}
        <TocNavigator
          {model}
          onselect={(id) => { selectedNodeId = id; centerNode(id); }}
        />
      {/if}
      <button
        class="tm-toc-toggle"
        type="button"
        title={tocOpen ? "Collapse navigator" : "Expand navigator"}
        aria-label={tocOpen ? "Collapse navigator" : "Expand navigator"}
        onclick={() => { tocOpen = !tocOpen; }}
      >{tocOpen ? "‹" : "›"}</button>
    </div>
    {#if tocOpen}
      <ResizeHandle label="Resize navigator" ondrag={resizeToc} onend={persistWidths} />
    {/if}
  {/if}
  <div class="tm-canvas" class:tm-view-dependency={viewMode === "dependency"} bind:this={canvasEl}>
    {#key loadId}
    <SvelteFlow
      bind:nodes
      bind:edges
      fitView
      proOptions={{ hideAttribution: true }}
      onselectionchange={({ nodes: sel }) => { selectedNodeId = sel[0]?.id ?? null; }}
      ondelete={({ edges: removed }) => handleEdgeDelete(removed)}
      onconnect={handleConnect}
      onpanecontextmenu={({ event }) => openPaneMenu(event)}
      onnodecontextmenu={({ node, event }) => openNodeMenu(node, event)}
      onedgecontextmenu={({ edge, event }) => openEdgeMenu(edge, event)}
      onnodedragstop={({ nodes: dragged }) => {
        // Dependency view positions are dagre-owned, so persisting drags would corrupt the entity graph.
        if (viewMode === "dependency") return;
        // positionStore still holds the pre-drag positions at this point, not the dragged ones.
        recordSnapshot();
        for (const n of dragged) positionStore.set(n.id, { x: n.position.x, y: n.position.y });
      }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1.6} />
      <Controls>
        <ControlButton onclick={toggleFullscreen} title="Toggle fullscreen">
          {#if fullscreen}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
          {:else}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          {/if}
        </ControlButton>
      </Controls>
      <MiniMap />
      <FlowApi onready={(api) => { flowApi = api; }} />
    </SvelteFlow>
    {/key}

    {#if pendingConnect}
      <RelationPicker
        choices={pendingConnect.choices}
        x={pendingConnect.x}
        y={pendingConnect.y}
        onpick={handlePickerPick}
        oncancel={handlePickerCancel}
      />
    {/if}

    {#if contextMenu}
      <ContextMenu
        items={contextMenu.items}
        x={contextMenu.x}
        y={contextMenu.y}
        onclose={() => { contextMenu = null; }}
      />
    {/if}
  </div>

  {#if selectedNodeId && model && world}
    <ResizeHandle label="Resize inspector" ondrag={resizeInspector} onend={persistWidths} />
    <NodeInspector
      {selectedNodeId}
      {model}
      {world}
      width={inspectorWidth}
      onscriptsave={handleScriptSave}
      onrename={applyRename}
      onsetrecurring={(t, v) => { recordSnapshot(); setRecurring(worldRecord(), t, v); rebuild(); }}
      onupdateentry={(t, list, idx, field, value) => { recordSnapshot(); updateStructuredEntry(worldRecord(), t, list, idx, field, value); rebuild(); }}
      onremoveentry={(t, list, idx) => { recordSnapshot(); removeEntryAt(worldRecord(), t, list, idx); rebuild(); }}
      onaddentry={(t, list, entry) => { recordSnapshot(); appendEntry(worldRecord(), t, list, entry); rebuild(); }}
      onselect={(id) => { selectedNodeId = id; centerNode(id); }}
    />
  {/if}
</div>

{#if model}
  <MapLegend {viewMode} />
{/if}

<style>
  .tm-layout { display: flex; width: 100%; height: 72vh; }
  .tm-canvas { flex: 1; min-width: 0; border: 1px solid var(--color-border); border-radius: var(--radius-md); position: relative; overflow: hidden; }
  .tm-toolbar { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 0.75rem; flex-wrap: wrap; }
  .tm-header-controls { display: flex; align-items: center; gap: 0.5rem; }
  .tm-error { color: var(--color-error); }
  .tm-btn {
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-subtle);
    color: var(--color-text);
    font-size: 0.85rem;
    cursor: pointer;
    white-space: nowrap;
  }
  .tm-btn:hover:not(:disabled) { background: var(--color-bg-code-toolbar); }
  .tm-btn:disabled { opacity: 0.45; cursor: default; }

  .tm-file { display: inline-flex; align-items: center; }
  .tm-file__input { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); border: 0; }
  .tm-file__name { align-self: center; font-size: 0.85rem; color: var(--color-text-muted); }

  /* Drive Svelte Flow's theme vars from the site tokens so the canvas follows light/dark. */
  .tm-canvas :global(.svelte-flow) {
    --xy-background-color: var(--color-bg-subtle);
    --xy-background-pattern-color: var(--color-border);
    --xy-node-background-color: var(--color-bg);
    --xy-node-color: var(--color-text);
    --xy-node-border-radius: var(--radius-sm);
    --xy-node-boxshadow-hover: var(--shadow-card-hover);
    --xy-node-border-selected: 1px solid var(--color-accent);
    --xy-edge-stroke: var(--color-text-muted);
    --xy-edge-stroke-selected: var(--color-accent);
    --xy-edge-label-background-color: var(--color-bg-subtle);
    --xy-edge-label-color: var(--color-text-muted);
    --xy-connectionline-stroke: var(--color-accent);
    --xy-handle-background-color: var(--color-accent);
    --xy-handle-border-color: var(--color-bg);
    --xy-controls-button-background-color: var(--color-bg-subtle);
    --xy-controls-button-background-color-hover: var(--color-bg-code-toolbar);
    --xy-controls-button-color: var(--color-text);
    --xy-controls-button-color-hover: var(--color-text-heading);
    --xy-controls-button-border-color: var(--color-border);
    --xy-controls-box-shadow: var(--shadow-card);
    --xy-minimap-background-color: var(--color-bg-subtle);
    --xy-minimap-node-background-color: var(--color-border);
    --xy-minimap-mask-background-color: color-mix(in srgb, var(--color-bg-subtle), transparent 35%);
    --xy-attribution-background-color: transparent;
    --xy-attribution-color: var(--color-text-muted);
  }

  /* Bigger connection handles , the default dot is too small to grab reliably. */
  .tm-canvas :global(.svelte-flow__handle) { width: 12px; height: 12px; border-width: 2px; }

  /* Graph view only: triggers are pure connection sources and every other kind a pure target. */
  .tm-canvas:not(.tm-view-dependency) :global(.tm-node:not(.tm-trigger) .svelte-flow__handle.source) { display: none; }
  /* An inferred gates edge can still target a trigger, so the anchor must stay in layout. */
  .tm-canvas:not(.tm-view-dependency) :global(.tm-node.tm-trigger .svelte-flow__handle.target) { visibility: hidden; }
  /* Dependency edges are derived, not authorable, so no handle should invite a drag. */
  .tm-canvas.tm-view-dependency :global(.svelte-flow__handle) { visibility: hidden; }

  /* Minimap and controls were easy to miss without a defined edge. */
  .tm-canvas :global(.svelte-flow__minimap),
  .tm-canvas :global(.svelte-flow__controls) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-card-hover);
    overflow: hidden;
  }

  /* fixed width matches the layout's NODE_W so de-overlap spacing stays valid */
  :global(.tm-node) {
    width: 200px;
    box-sizing: border-box;
    padding: 6px 10px;
    white-space: normal;
    overflow-wrap: anywhere;
    text-align: center;
    line-height: 1.3;
    border-radius: var(--radius-sm);
    font-size: 12px;
    background: var(--color-bg);
    color: var(--color-text);
  }
  /* faint same-hue fill so node kinds read apart at a glance without dimming the label */
  :global(.tm-trigger) { border: 1px solid #4c8dff; background: color-mix(in srgb, #4c8dff 10%, var(--color-bg)); }
  :global(.tm-quest) { border: 1px solid #d29922; background: color-mix(in srgb, #d29922 10%, var(--color-bg)); }
  :global(.tm-npc) { border: 1px solid #2da44e; background: color-mix(in srgb, #2da44e 10%, var(--color-bg)); }
  :global(.tm-location) { border: 1px solid #a371f7; background: color-mix(in srgb, #a371f7 10%, var(--color-bg)); }
  :global(.tm-faction) { border: 1px solid #e0569e; background: color-mix(in srgb, #e0569e 10%, var(--color-bg)); }
  :global(.tm-trait) { border: 1px solid #1f9aa8; background: color-mix(in srgb, #1f9aa8 10%, var(--color-bg)); }
  :global(.tm-storage-key) { border: 1px dashed var(--color-text-muted); background: color-mix(in srgb, var(--color-text-muted) 8%, var(--color-bg)); }
  /* dependency view colors triggers by their role in the control-flow graph, not by node kind */
  :global(.tm-dep-entry) { border: 1px solid #2da44e; background: color-mix(in srgb, #2da44e 12%, var(--color-bg)); }
  :global(.tm-dep-link) { border: 1px solid #4c8dff; background: color-mix(in srgb, #4c8dff 12%, var(--color-bg)); }
  :global(.tm-dep-terminal) { border: 1px solid #a371f7; background: color-mix(in srgb, #a371f7 12%, var(--color-bg)); }
  :global(.tm-dep-accumulator) { border: 1px solid #e0569e; background: color-mix(in srgb, #e0569e 12%, var(--color-bg)); }
  :global(.tm-dep-recurring) { border: 1px solid #d29922; background: color-mix(in srgb, #d29922 12%, var(--color-bg)); }
  :global(.tm-dep-isolated) { border: 1px dashed var(--color-text-muted); background: color-mix(in srgb, var(--color-text-muted) 8%, var(--color-bg)); }
  /* script-origin edges: class lands on the <g> wrapper; chain to the actual <path> */
  :global(.svelte-flow__edge.tm-edge-script .svelte-flow__edge-path) { stroke-dasharray: 4 4; opacity: 0.6; }
  /* selected-node incident edges highlighted in accent color */
  :global(.svelte-flow__edge.tm-edge-active .svelte-flow__edge-path) { stroke: var(--color-accent); stroke-width: 2.5; }

  /* Fullscreen fills everything below the header, spanning the full width over the nav sidebar. */
  .tm--fullscreen {
    position: fixed;
    top: var(--header-height);
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    background: var(--color-bg);
    /* override the base width:100% which under fixed positioning becomes 100vw and overflows past right:0 */
    width: auto;
    height: auto;
    box-sizing: border-box;
  }
  /* Flush against the chrome: the border/radius would otherwise leave a gap at the header edge. */
  .tm--fullscreen .tm-canvas { border: none; border-radius: 0; }

  .tm-toc-wrap {
    display: flex;
    flex-shrink: 0;
  }
  .tm-toc-wrap--collapsed { width: auto; }

  .tm-toc-toggle {
    width: 18px;
    flex-shrink: 0;
    background: var(--color-bg-subtle);
    border: none;
    border-right: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .tm-toc-toggle:hover { background: var(--color-bg-code-toolbar); color: var(--color-text); }
</style>
