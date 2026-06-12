export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "wiki-theme";
const VALID_CHOICES: ThemeChoice[] = ["light", "dark", "system"];

export function resolveTheme(choice: ThemeChoice, systemPreference: ResolvedTheme): ResolvedTheme {
  if (choice === "system") return systemPreference;
  return choice;
}

export function persistThemeChoice(choice: ThemeChoice): void {
  localStorage.setItem(STORAGE_KEY, choice);
}

export function readThemeChoice(): ThemeChoice {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw && (VALID_CHOICES as string[]).includes(raw)) {
    return raw as ThemeChoice;
  }
  return "system";
}

export function detectSystemPreference(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.setAttribute("data-theme", theme);
}
