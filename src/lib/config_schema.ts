import * as z from "zod";
import { sectionIds } from "./sections.ts";

/** Raised whenever the document changes shape, with a step in `config_migrations.ts`. */
export const CONFIG_VERSION = 2;

/** Each one has a block in `src/themes/presets.css`. */
export const themePresets = [
  "tau",
  "rose-pine",
  "rose-pine-moon",
  "rose-pine-dawn",
  "catppuccin-mocha",
  "catppuccin-macchiato",
  "catppuccin-frappe",
  "catppuccin-latte",
  "nord",
  "material"
] as const;

const section = z
  .literal([true, false, "auto"])
  .default("auto")
  .describe(
    "`true` always shows this section, `false` removes it, and `auto` shows it when there's room."
  );

const bar = z
  .object({
    direction: z
      .enum(["top", "bottom", "floating"])
      .default("top")
      .describe(
        [
          "The visual direction of the widget.",
          "`top`- The top of the widget has inverted corner radius, and the bottom has normal corner radius.",
          "`bottom`- The bottom of the widget has inverted corner radius, and the top has normal corner radius.",
          "`floating`- All corners of the widget have normal corner radius."
        ].join("\n\n")
      ),
    gradient: z
      .enum(["top", "bottom", "solid", "disabled"])
      .default("top")
      .describe(
        [
          "The direction of the background gradient.",
          "`top`- From top to transparent bottom.",
          "`bottom`- From bottom to transparent top.",
          "`solid`- Solid color background.",
          "`disabled`- Background color is disabled."
        ].join("\n\n")
      ),
    attachSides: z
      .boolean()
      .default(true)
      .describe(
        [
          "Whether to attach the left and right sides of the widgets or to use smooth corners.",
          "To see the full corners, you must have some margin (`--bar-margin-x` in `theme.customCss`)"
        ].join("\n\n")
      ),
    backgroundEffect: z
      .enum(["inherit", "acrylic", "blur", "mica"])
      .default("inherit")
      .describe(
        [
          "The background effect to use for the widget.",
          "NOTE: Anything other than inherit needs Zebar 3.2 or later. More details in the README.",
          [
            "`inherit`- Don't change the effect, and use the one defined in zpack.json (probably transparent).",
            "`acrylic`- Use an acrylic background effect. Windows 10, 11.",
            "`blur`- Use a blur background effect. Windows 10, 11.",
            "`mica`- Use a mica background effect. Windows 11 only."
          ].join("\n")
        ].join("\n\n")
      ),
    transitionDuration: z
      .number()
      .min(0)
      .default(400)
      .describe("The duration of transitions in milliseconds."),
    primaryMonitorOnly: z
      .array(z.enum(sectionIds))
      .default(["network", "media", "volume"])
      .describe("Sections that only appear on the primary monitor.")
  })
  .prefault({});

const theme = z
  .object({
    preset: z
      .enum(themePresets)
      .default("tau")
      .describe("The color preset the bar starts from."),
    colors: z
      .record(z.string(), z.string())
      .default({})
      .describe(
        'Overrides for individual colors, as HSL without commas. For example `{ "accent": "300 100% 50%" }`. See the README for the names.'
      ),
    fontFamily: z
      .string()
      .nullable()
      .default(null)
      .describe(
        "The font of the bar, as a CSS font family. Montserrat is bundled as `Montserrat Variable`, and `null` uses it."
      ),
    fontSize: z
      .string()
      .default("14px")
      .describe(
        "The font size. Every part of the bar is sized from it, so to scale the bar, change this and the height in `zpack.json` together."
      ),
    radius: z.string().default("20px").describe("The corner radius."),
    customCss: z
      .string()
      .default("")
      .describe(
        "CSS added after the theme, which can override anything. A `custom.css` file beside this one sets it too, which is easier for more than a few lines."
      )
  })
  .prefault({});

const sections = z
  .object({
    power: section,
    heart: section,
    cpu: section,
    memory: section,
    battery: section,
    network: z
      .literal([true, false, "auto", "interface", "statistics"])
      .default("auto")
      .describe(
        "Like the other sections, with `interface` to only show the connection and `statistics` to only show the transfer rates."
      ),
    media: section,
    volume: section,
    weather: section,
    clock: z.boolean().default(true)
  })
  .prefault({});

const workspaces = z
  .object({
    thinButtons: z
      .literal([true, false, "auto"])
      .default("auto")
      .describe(
        "Whether workspace buttons are thin. `auto` makes them thin when space runs out."
      )
  })
  .prefault({});

const volume = z
  .object({
    sliderOpen: z
      .boolean()
      .default(false)
      .describe(
        "Whether the volume slider starts open. It stays closed while it doesn't fit, even with everything else hidden."
      )
  })
  .prefault({});

const weather = z
  .object({
    unit: z
      .enum(["celsius", "fahrenheit"])
      .default("celsius")
      .describe(
        "The unit the temperature starts in. Clicking the weather switches it."
      )
  })
  .prefault({});

const clock = z
  .object({
    use24h: z
      .literal([true, false, "auto"])
      .default("auto")
      .describe("Whether to use a 24-hour clock. `auto` follows the system."),
    showSeconds: z.boolean().default(false),
    fullDate: z
      .literal([true, false, "auto"])
      .default("auto")
      .describe(
        "Whether to show the full date beside the time. `auto` drops it when space runs out, and clicking the clock switches it."
      )
  })
  .prefault({});

const windowSelection = z.enum(["workspace", "monitor", "all"]);

const taskbarIntegration = z
  .object({
    enabled: z
      .boolean()
      .default(false)
      .describe("Whether to integrate with the windows taskbar."),
    extraIcons: z
      .number()
      .default(0)
      .describe(
        "The number of additional icons that appear in the taskbar (like windows logo or search)."
      ),
    primaryMonitorSelection: windowSelection
      .default("all")
      .describe("Which windows to include in the number of taskbar icons."),
    secondaryMonitorSelection: windowSelection.default("monitor"),
    iconWidth: z
      .string()
      .default("50px")
      .describe("The width of one taskbar icon."),
    marginLeft: z
      .string()
      .default("1rem")
      .describe("Space to keep clear at the left end of the bar."),
    marginRight: z
      .string()
      .default("1rem")
      .describe("Space to keep clear at the right end of the bar.")
  })
  .prefault({});

const refreshIntervals = z
  .object({
    cpu: z.number().default(2000),
    memory: z.number().default(5000),
    battery: z.number().default(60000),
    weather: z.number().default(900000),
    network: z.number().default(2000)
  })
  .prefault({});

const providers = z
  .object({
    refreshIntervals: refreshIntervals.describe(
      "The refresh intervals for some providers."
    ),
    logErrors: z
      .boolean()
      .default(false)
      .describe("Whether to log provider errors to the console.")
  })
  .prefault({});

/**
 * Every setting, with its default. Every key has a default, so a partial document
 * is valid, and unknown keys are dropped rather than rejected. The descriptions
 * become the editor hints in `schema.json`.
 */
export const configSchema = z.object({
  version: z
    .number()
    .default(CONFIG_VERSION)
    .describe("The format of this file. Older formats are upgraded on import."),
  bar,
  theme,
  sections,
  workspaces,
  volume,
  weather,
  clock,
  autoTiling: z
    .boolean()
    .default(true)
    .describe("Whether to enable built-in automatic tiling of windows."),
  clickThroughByDefault: z
    .boolean()
    .default(false)
    .describe("Enable click-through by default."),
  taskbarIntegration: taskbarIntegration.describe(
    [
      "Whether to integrate with the windows taskbar.",
      "Right now, this feature only adds an area at the center of the widget that contains the window icons. Please see README for more information."
    ].join("\n\n")
  ),
  providers: providers.describe(
    "Options for the providers, including refresh intervals and error logging."
  )
});

export type Config = z.infer<typeof configSchema>;
export type AttachmentDirection = Config["bar"]["direction"];
export type BackgroundEffect = Config["bar"]["backgroundEffect"];
export type TaskbarIntegration = Config["taskbarIntegration"];
export type Theme = Config["theme"];

export const defaultConfig = configSchema.parse({});
