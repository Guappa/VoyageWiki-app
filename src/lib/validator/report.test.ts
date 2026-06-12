import { describe, it, expect } from "vitest";
import { generateMarkdownReport, bucketize } from "./report";
import { validateWorld } from "./index";
import type { Issue, ValidationResult } from "./types";

describe("bucketize", () => {
  it("groups issues sharing title + fix and lists each entry's value", () => {
    const issues: Issue[] = [
      { path: "npcs.A.type", severity: "error", title: "unknown npcType", fix: "use an existing key", value: "Dragon" },
      { path: "npcs.B.type", severity: "error", title: "unknown npcType", fix: "use an existing key", value: "Warg" },
    ];
    const buckets = bucketize(issues);
    expect(buckets.length).toBe(1);
    expect(buckets[0].kind).toBe("group");
    if (buckets[0].kind === "group") {
      expect(buckets[0].title).toBe("unknown npcType");
      expect(buckets[0].entries.map((e) => e.value)).toEqual(["Dragon", "Warg"]);
    }
  });

  it("keeps a lone issue as a single", () => {
    const buckets = bucketize([{ path: "x", severity: "warning", title: "t", fix: "f" }]);
    expect(buckets[0].kind).toBe("single");
  });
});

describe("markdown report", () => {
  it("writes the action once per group and lists every entry path", () => {
    const result: ValidationResult = {
      errors: [], warnings: [],
      recommendations: [
        { path: "npcs.A.type", severity: "recommendation", title: "unknown npcType", fix: "use an existing key", value: "Dragon" },
        { path: "npcs.B.type", severity: "recommendation", title: "unknown npcType", fix: "use an existing key", value: "Warg" },
      ],
    };
    const md = generateMarkdownReport(result, { errors: true, warnings: true, recommendations: true });
    expect(md).toContain("unknown npcType (2 entries)");
    expect(md).toContain("Action: use an existing key");
    expect(md).toContain("`npcs.A.type`");
    expect(md).toContain("`npcs.B.type`");
  });
});

describe("validateWorld visualDescription recommendation", () => {
  it("is structured with the affected preview in detail", () => {
    const npcs: Record<string, unknown> = {};
    for (let i = 1; i <= 7; i++) npcs["NPC " + i] = { visualDescription: "tall figure" };
    const result = validateWorld({ npcs });
    const rec = result.recommendations.find((r) => r.path === "npcs" && r.title.includes("visualDescription"));
    expect(rec).toBeTruthy();
    expect(rec!.fix.length).toBeGreaterThan(0);
    expect(rec!.detail ?? "").toMatch(/Affected:/);
  });
});
