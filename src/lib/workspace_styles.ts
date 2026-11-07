import type { WorkspaceStyle } from "#lib/config_schema.ts";

export type WorkspaceItem = {
  id: string;
  /** What the button shows, which is the display name when GlazeWM has one. */
  label: string;
  /** Which of the theme's workspace colors it has, from 1. */
  color: number;
  current: boolean;
  /** Has no windows, which only a kept-alive workspace can be while not current. */
  empty?: boolean;
};

/** How many workspace colors each theme has. */
const WORKSPACE_COLORS = 5;

/**
 * Which color a workspace has. A number in its name decides it, so the color stays
 * the same when other workspaces come and go. A name without one goes by `position`.
 */
export function workspaceColor(name: string, position: number) {
  const number = parseInt(/\d+/.exec(name)?.[0] ?? "", 10);
  const index = Number.isNaN(number) ? position : number - 1;
  return (
    (((index % WORKSPACE_COLORS) + WORKSPACE_COLORS) % WORKSPACE_COLORS) + 1
  );
}

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
