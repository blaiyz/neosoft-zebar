import type { WorkspaceStyle } from "#lib/config_schema.ts";

export type WorkspaceItem = {
  id: string;
  name: string;
  /** Which of the theme's workspace colors it has, from 1. */
  color: number;
  current: boolean;
};

/** The space after each workspace button, written out in full for Tailwind to find. */
export const workspaceGaps: Record<WorkspaceStyle, string> = {
  keys: "mr-2",
  track: "mr-0",
  string: "mr-0.5",
  solid: "mr-1.5"
};

/** The width of a workspace button. A string's other beads have no room for a name. */
export function workspaceWidth(
  style: WorkspaceStyle,
  thin: boolean,
  current: boolean
) {
  if (style === "string") return current ? "min-w-11 px-2" : "min-w-6 px-0";
  return thin ? "min-w-8" : "min-w-14 px-2";
}
