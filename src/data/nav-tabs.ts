export interface TabConfig {
  tab: string;
  heading: string;
  href: string;
  collapsible: boolean;
  staticLinks?: Array<{ label: string; href: string; advanced?: boolean }>;
}

export const TAB_ORDER: TabConfig[] = [
{ tab: "mods",       heading: "Mods",       href: "/mods",       collapsible: true },
  { tab: "world",      heading: "World",       href: "/world",      collapsible: true },
  { tab: "mechanics",  heading: "Mechanics",   href: "/mechanics",  collapsible: true },
  { tab: "ai",         heading: "AI",          href: "/ai",         collapsible: true },
  { tab: "other",      heading: "Other",       href: "/other",      collapsible: true },
  { tab: "appendix",   heading: "Appendix",    href: "/appendix",   collapsible: true },
];

// Tools section has no content files — fully static.
export const TOOLS_GROUP: TabConfig = {
  tab: "tools",
  heading: "Tools",
  href: "/tools",
  collapsible: true,
  staticLinks: [
    { label: "Validator",       href: "/tools/validator" },
    { label: "Trigger Map",     href: "/tools/trigger-map" },
    { label: "Schema explorer", href: "/tools/schema" },
    { label: "Field index",     href: "/tools/fields" },
    { label: "API",             href: "/tools/api" },
  ],
};
