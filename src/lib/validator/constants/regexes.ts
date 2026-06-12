// Regexes that parse trigger `script` bodies for capability checks; they match JS source, not schema-derived data.
export const RE_CHECK_TYPE  = /check\s*\(\s*\{[^}]*?type\s*:\s*['"]([^'"]+)['"]/g;
export const RE_EFFECTS_IDX = /effects\s*\[\s*(\d+)\s*\]\s*=/g;
export const RE_EFFECTS_PSH = /effects\s*\.\s*push\s*\(/g;
export const RE_SKIP_UNCOND = /(?<![}\w])skip\s*=\s*true\s*;?(?!\s*\/\/[^\n]*\bconditional\b)/i;
export const RE_SKIP_IN_IF  = /\bif\b/;
