import { describe, it, expect } from "vitest";
import { findFieldDefinition } from "./walker";

const fixtureSchema = {
  npcs: {
    type: "array",
    items: {
      properties: {
        voiceTag: { type: "string", maxLength: 64 },
        basicInfo: {
          type: "object",
          properties: {
            race: { type: "string", maxLength: 32 }
          }
        }
      }
    }
  }
};

describe("findFieldDefinition", () => {
  it("returns null when the section is missing", () => {
    expect(findFieldDefinition(fixtureSchema, "missing", "foo")).toBeNull();
  });

  it("returns a top-level field inside a section", () => {
    expect(findFieldDefinition(fixtureSchema, "npcs", "voiceTag"))
      .toEqual({ type: "string", maxLength: 64 });
  });

  it("returns a nested field via dotted path", () => {
    expect(findFieldDefinition(fixtureSchema, "npcs", "basicInfo.race"))
      .toEqual({ type: "string", maxLength: 32 });
  });

  it("returns null when the nested path does not resolve", () => {
    expect(findFieldDefinition(fixtureSchema, "npcs", "basicInfo.unknown")).toBeNull();
  });
});
