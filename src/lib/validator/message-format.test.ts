import { describe, it, expect } from "vitest";
import { validateWorld } from "./index";
import malformed from "./__fixtures__/malformed-world.json";

const EM_DASH = "—";

// Locks the structured-message contract so new checks render uniformly in the in-browser tool, Copy-as-Markdown, and the API.
describe("validator message structure", () => {
  const result = validateWorld(malformed);
  const all = [...result.errors, ...result.warnings, ...result.recommendations];

  it("the malformed fixture exercises a broad set of checks", () => {
    expect(all.length).toBeGreaterThan(30);
  });

  for (const issue of all) {
    const label = `[${issue.severity}] ${issue.path}: ${issue.title}`;

    it(`has a non-empty title — ${label}`, () => {
      expect(issue.title.trim().length, label).toBeGreaterThan(0);
    });

    it(`has a non-empty fix — ${label}`, () => {
      expect(issue.fix.trim().length, label).toBeGreaterThan(0);
    });

    it(`title is one clause, no internal em-dash — ${label}`, () => {
      expect(issue.title.includes(` ${EM_DASH} `), `${label} :: move trailing context into detail and the action into fix`).toBe(false);
    });

    it(`has balanced backtick chips — ${label}`, () => {
      const text = issue.title + " " + issue.fix + " " + (issue.detail ?? "");
      expect((text.match(/`/g) ?? []).length % 2, label).toBe(0);
    });
  }
});
