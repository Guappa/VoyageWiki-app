import { describe, it, expect } from "vitest";
import { serializeWorld } from "./serialize";

describe("serializeWorld", () => {
  it("round-trips a world without data loss", () => {
    const world = {
      triggers: { t: { name: "t", conditions: [], effects: [{ type: "quest-init", value: "Q" }], script: "" } },
      quests: { Q: { name: "Q" } },
    };
    expect(JSON.parse(serializeWorld(world))).toEqual(world);
  });

  it("escapes real newlines in a script to \\n and parses them back", () => {
    const world = { triggers: { t: { name: "t", conditions: [], effects: [], script: "if (x) {\n  y = 1;\n}" } } };
    const text = serializeWorld(world);
    expect(text).toContain("\\n");                 // stored as escaped \n in the JSON text
    expect(text).not.toContain("\n  y = 1");        // not a literal newline inside the string token
    expect(JSON.parse(text).triggers.t.script).toBe("if (x) {\n  y = 1;\n}"); // parses back to real newlines
  });

  it("produces indented (pretty) JSON", () => {
    expect(serializeWorld({ a: 1 })).toBe('{\n  "a": 1\n}');
  });
});
