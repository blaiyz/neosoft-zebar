import type { TaskbarIntegration, Theme } from "#lib/config_schema.ts";

/** Read by the script in `src/app.html` to paint the theme before the page loads. */
const THEME_KEY = "neosoft.theme";

/** How long things take to leave, which is quicker than they arrive. */
export const exitTime = (duration: number) => duration * 0.65;

/** The colors `theme.colors` can replace. */
export const themeColors = [
  "text",
  "accent",
  "bg",
  "muted",
  "border",
  "shadow",
  "icon",
  "bg-focused",
  "bg-unfocused",
  "cpu",
  "cpu-high-usage",
  "memory",
  "memory-high-usage",
  "disk",
  "disk-high-usage",
  "battery-good",
  "battery-mid",
  "battery-low",
  "process",
  "focused-process",
  "ws-1",
  "ws-2",
  "ws-3",
  "ws-4",
  "ws-5",
  "tiling-direction",
  "click-through",
  "paused",
  "network",
  "weather",
  "keyboard",
  "volume-start",
  "volume-end",
  "volume-inner"
];

export type ThemeSnapshot = {
  preset: string;
  /** CSS variables that replace the preset's. */
  variables: Record<string, string>;
  customCss: string;
};

export function applyTheme(theme: Theme, taskbar: TaskbarIntegration) {
  const snapshot: ThemeSnapshot = {
    preset: theme.preset,
    variables: {
      ...Object.fromEntries(
        Object.entries(theme.colors).map(([name, value]) => [
          `--${name}`,
          value
        ])
      ),
      ...(theme.fontFamily !== null && { "--font-family": theme.fontFamily }),
      "--font-size": theme.fontSize,
      "--radius": theme.radius,
      "--process-icon-width": taskbar.iconWidth,
      "--left-margin": taskbar.marginLeft,
      "--right-margin": taskbar.marginRight
    },
    customCss: theme.customCss
  };

  window.paintTheme(snapshot);
  localStorage.setItem(THEME_KEY, JSON.stringify(snapshot));
}
