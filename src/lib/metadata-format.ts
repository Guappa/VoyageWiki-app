function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const INLINE_CODE_RE = /`([^`]+)`/g;
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
const RELATED_SPLIT_RE = /;\s+/;
const RELATED_LINK_WITH_DESC_RE = /\[([^\]]+)\]\(([^)]+)\)\s*-\s*(.+)/;
const RELATED_LINK_ONLY_RE = /\[([^\]]+)\]\(([^)]+)\)/;

function renderInline(text: string): string {
  let result = escapeHtml(text);
  result = result.replace(INLINE_CODE_RE, (_, code) => "<code>" + code + "</code>");
  result = result.replace(LINK_RE, (_, label, href) => "<a href=\"" + href + "\">" + label + "</a>");
  return result;
}

export function renderMetadataValue(text: string): string {
  return renderInline(text);
}

export interface RelatedItem {
  label: string;
  href: string;
  description: string;
}

export function parseRelated(text: string): RelatedItem[] {
  const items: RelatedItem[] = [];
  const segments = text.split(RELATED_SPLIT_RE);
  for (const segment of segments) {
    const withDesc = segment.match(RELATED_LINK_WITH_DESC_RE);
    if (withDesc) {
      items.push({ label: withDesc[1].trim(), href: withDesc[2].trim(), description: withDesc[3].trim() });
      continue;
    }
    const linkOnly = segment.match(RELATED_LINK_ONLY_RE);
    if (linkOnly) {
      items.push({ label: linkOnly[1].trim(), href: linkOnly[2].trim(), description: "" });
    }
  }
  return items;
}
