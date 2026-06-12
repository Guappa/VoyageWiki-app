export type Severity = "error" | "warning" | "recommendation";

export interface Issue {
  path: string;
  severity: Severity;
  title: string;
  fix: string;
  detail?: string;
  value?: string;
  docsAnchor?: string;
}

export interface ValidationResult {
  errors: Issue[];
  warnings: Issue[];
  recommendations: Issue[];
}

export interface ValidationContext {
  errors: Issue[];
  warnings: Issue[];
  recommendations: Issue[];
}

export type World = Record<string, unknown>;
