import type { TaskbarIntegration, Theme } from "#lib/config_schema.ts";

/** Read by the script in `src/app.html` to paint the theme before the page loads. */
const THEME_KEY = "neosoft.theme";

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
