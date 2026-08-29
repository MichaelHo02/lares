import type { ToolDescriptor } from "../types";
import { GATED_TOOLS } from "./checkout";
import { READ_TOOLS } from "./read";
import { WRITE_TOOLS } from "./write";

export const LARES_TOOLS: readonly ToolDescriptor[] = [
  ...READ_TOOLS,
  ...WRITE_TOOLS,
  ...GATED_TOOLS,
];

export const TOOL_GROUPS: readonly {
  label: string;
  tools: readonly ToolDescriptor[];
}[] = [
  { label: "Read", tools: READ_TOOLS },
  { label: "Write", tools: WRITE_TOOLS },
  { label: "Gated", tools: GATED_TOOLS },
];

export { GATED_TOOLS, READ_TOOLS, WRITE_TOOLS };
