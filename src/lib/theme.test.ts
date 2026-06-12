import { describe, it, expect, beforeEach, vi } from "vitest";
import { resolveTheme, persistThemeChoice, readThemeChoice } from "./theme";

describe("resolveTheme", () => {
  it("returns 'light' when choice is 'light' regardless of system", () => {
    expect(resolveTheme("light", "dark")).toBe("light");
  });

  it("returns 'dark' when choice is 'dark' regardless of system", () => {
    expect(resolveTheme("dark", "light")).toBe("dark");
  });

  it("uses system preference when choice is 'system'", () => {
    expect(resolveTheme("system", "dark")).toBe("dark");
    expect(resolveTheme("system", "light")).toBe("light");
  });
});

describe("persistThemeChoice and readThemeChoice", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; }
    });
  });

  it("round-trips a stored choice", () => {
    persistThemeChoice("dark");
    expect(readThemeChoice()).toBe("dark");
  });

  it("returns 'system' when no choice has been stored", () => {
    expect(readThemeChoice()).toBe("system");
  });

  it("returns 'system' when stored value is invalid", () => {
    localStorage.setItem("wiki-theme", "purple");
    expect(readThemeChoice()).toBe("system");
  });
});
