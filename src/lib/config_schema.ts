import * as z from "zod";
import { barItems, defaultArrangement, sectionIds } from "./sections.ts";

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

/** A section that's off until it's turned on. */
const optionalSection = z
  .literal([true, false, "auto"])
  .default(false)
  .describe(
    "`true` always shows this section, `false` removes it, and `auto` shows it when there's room. Off by default."
  );

const highUsage = z
  .number()
  .min(0)
  .max(100)
  .default(80)
  .describe(
    "The usage, in percent, from which the meter has its high usage color."
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
        'Overrides for individual colors, as HSL without commas, or another color as `var(--name)`. For example `{ "accent": "300 100% 50%", "cpu": "var(--ws-2)" }`. See the README for the names.'
      ),
    fontFamily: z
      .string()
      .nullable()
      .default(null)
      .describe(
        "The font of the bar, as a CSS font family. Figtree is bundled as `Figtree Variable`, and `null` uses it."
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
    settings: z
      .boolean()
      .default(true)
      .describe(
        "Whether the bar has a button for the settings window, which Zebar's tray menu opens too."
      ),
    power: section,
    heart: section,
    cpu: section,
    memory: section,
    disk: optionalSection,
    battery: section,
    network: z
      .literal([true, false, "auto", "interface", "statistics"])
      .default("auto")
      .describe(
        "Like the other sections, with `interface` to only show the connection and `statistics` to only show the transfer rates."
      ),
    media: section,
    tray: z
      .literal([true, false, "auto"])
      .default(false)
      .describe(
        "The system tray, with its pinned icons in the bar. Off by default, because on Windows 10 the tray provider can break the native system tray until Explorer restarts. Turning it off stops the provider, which gives the native tray back, but Zebar can only start it once each time it runs, so turning it on again needs a restart of Zebar."
      ),
    keyboard: optionalSection,
    volume: section,
    weather: section,
    clock: z.boolean().default(true)
  })
  .prefault({});

const arrangedItems = (group: keyof typeof defaultArrangement) =>
  z.array(z.enum(barItems)).default(() => [...defaultArrangement[group]]);

const arrangement = z
  .object({
    left: arrangedItems("left"),
    middle: arrangedItems("middle"),
    right: arrangedItems("right")
  })
  .prefault({})
  .describe(
    [
      "Which group of the bar each item is in, in order. The items are `buttons` (the settings, power and heart buttons, which move together), `workspaces`, `taskbar` (the room kept for the taskbar's window icons, which only takes effect with taskbar integration) and every other section by name.",
      "The middle group is centred. With taskbar integration, `taskbar` stays in the centre, and what's before and after it in `middle` sits on either side of it. An item left out goes back to the end of the group it starts in, and `taskbar` can only be in `middle`."
    ].join("\n\n")
  );

const workspaces = z
  .object({
    style: z
      .enum(["keys", "track", "string", "solid"])
      .default("track")
      .describe(
        "How workspaces look. `keys` are tinted buttons with a ring around the current one, `track` is one groove with a bead across it, `string` shrinks the others to dots, and `solid` fills the current one with its color."
      ),
    thinButtons: z
      .literal([true, false, "auto"])
      .default("auto")
      .describe(
        "Whether workspace buttons are thin. `auto` makes them thin when space runs out."
      ),
    scrollToSwitch: z
      .boolean()
      .default(true)
      .describe(
        "Whether scrolling over the workspaces goes to the next or previous one."
      ),
    dimEmpty: z
      .boolean()
      .default(true)
      .describe(
        "Whether workspaces with no windows are dimmed. Only those that GlazeWM keeps alive can be empty without being shown."
      ),
    clickToFocus: z
      .boolean()
      .default(true)
      .describe("Whether clicking a window's icon focuses that window."),
    showPaused: z
      .boolean()
      .default(true)
      .describe(
        "Whether an icon shows while GlazeWM is paused with `wm-toggle-pause`."
      )
  })
  .prefault({});

const cpu = z.object({ highUsage }).prefault({});

const memory = z.object({ highUsage }).prefault({});

const disk = z
  .object({
    mountPoint: z
      .string()
      .default("C:\\")
      .describe(
        "The drive the meter shows, as Windows names it, like `C:\\`. The System flyout lists every drive."
      ),
    highUsage: highUsage.default(90)
  })
  .prefault({});

const battery = z
  .object({
    midCharge: z
      .number()
      .min(0)
      .max(100)
      .default(50)
      .describe(
        "The charge, in percent, at or below which the meter turns its middle color."
      ),
    lowCharge: z
      .number()
      .min(0)
      .max(100)
      .default(20)
      .describe(
        "The charge, in percent, at or below which the meter turns its low color."
      )
  })
  .prefault({});

const network = z
  .object({
    units: z
      .enum(["bytes", "bits"])
      .default("bytes")
      .describe(
        "Whether rates are in bytes, like `2.93 MiB/s`, or bits, like `24.6 Mb/s`."
      ),
    graph: z
      .literal([true, false, "auto"])
      .default("auto")
      .describe(
        "A graph of the last minute of traffic beside the rates. `auto` shows it when there's room."
      ),
    dimBelow: z
      .number()
      .min(0)
      .default(4)
      .describe(
        "Rates below this many KiB/s are dimmed, so the section is calm when little is moving. `0` never dims them."
      )
  })
  .prefault({});

const volume = z
  .object({
    scrollStep: z
      .number()
      .min(1)
      .max(100)
      .default(5)
      .describe(
        "How much, in percent, one step of the mouse wheel over the volume changes it."
      ),
    micIndicator: z
      .boolean()
      .default(false)
      .describe(
        "Whether a crossed-out microphone shows beside the volume while the default microphone is muted."
      )
  })
  .prefault({});

const keyboard = z
  .object({
    format: z
      .enum(["language", "layout"])
      .default("language")
      .describe(
        "`language` shows the layout's language in two letters, like `EN`, and `layout` its whole name, like `en-US`."
      )
  })
  .prefault({});

const media = z
  .object({
    style: z
      .enum(["pill", "tucked", "capsule", "equalizer"])
      .default("pill")
      .describe(
        "How the media controls look. `pill` puts them in a pill with progress around play, `tucked` keeps back and next hidden until hovered, `capsule` fills the whole section as the track plays, and `equalizer` has bars that move while it plays."
      ),
    appIcon: z
      .boolean()
      .default(true)
      .describe(
        "Whether the icon of the app that's playing shows before the title."
      ),
    titleOpensFlyout: z
      .boolean()
      .default(true)
      .describe(
        "Whether clicking the title opens the Media flyout, with the artist and every player. Off, it plays and pauses."
      ),
    scrollSessions: z
      .boolean()
      .default(true)
      .describe(
        "Whether scrolling over the media section switches between players, when more than one has something to play."
      )
  })
  .prefault({});

const weather = z
  .object({
    unit: z
      .enum(["celsius", "fahrenheit"])
      .default("celsius")
      .describe(
        "The unit of the temperature. Clicking the weather switches it."
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
      .literal([true, false, "auto", "preferred"])
      .default("auto")
      .describe(
        [
          "Whether to show the full date beside the time. Right-clicking the clock switches it between `preferred` and `false`.",
          "`auto`- It's the first thing to go when space runs out.",
          "`preferred`- Other sections give way to it, and it only goes if they can't make enough room.",
          "`true`- It always shows.",
          "`false`- It never shows."
        ].join("\n\n")
      )
  })
  .prefault({});

const tray = z
  .object({
    pinned: z
      .array(z.string())
      .default([])
      .describe("The tray icons shown in the bar, in their order."),
    order: z
      .array(z.string())
      .default([])
      .describe("The order of the tray icons. Dragging them sets it."),
    invertIcons: z
      .boolean()
      .default(false)
      .describe(
        "Inverts the tray icons, for monochrome icons that are hard to see on a light theme."
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

const performance = z
  .object({
    animations: z
      .enum(["all", "interactive", "none"])
      .default("all")
      .describe(
        [
          "Which animations run. Fewer animations take less CPU and GPU, which matters for something that's always on screen.",
          "`all`- Everything animates.",
          "`interactive`- Only what you do animates: hovering and clicking the bar, its flyouts and settings, and switching windows and workspaces in GlazeWM. Otherwise new readings, like CPU and memory, change without easing, and the equalizer rests.",
          "`none`- Nothing animates."
        ].join("\n\n")
      ),
    keepFlyoutsReady: z
      .boolean()
      .default(true)
      .describe(
        "Whether the flyout window keeps running in the background, so that flyouts open at once. Off, it starts as the pointer rests on the bar and closes a minute after the last flyout closes, which saves around 40 MB of memory in between. A flyout opened before it's ready takes about a second."
      )
  })
  .prefault({});

/** In milliseconds. Zebar takes a whole number, and spins on 0. */
const interval = (fallback: number) => z.int().min(100).default(fallback);

const refreshIntervals = z
  .object({
    cpu: interval(2000),
    memory: interval(5000),
    battery: interval(60000),
    weather: interval(900000),
    network: interval(2000),
    disk: interval(60000),
    keyboard: interval(1000)
  })
  .prefault({});

const providers = z
  .object({
    refreshIntervals: refreshIntervals.describe(
      "The refresh intervals for some providers, in milliseconds (at least 100)."
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
  arrangement,
  workspaces,
  cpu,
  memory,
  disk,
  battery,
  network,
  media,
  volume,
  keyboard,
  weather,
  clock,
  tray,
  autoTiling: z
    .boolean()
    .default(true)
    .describe("Whether to enable built-in automatic tiling of windows."),
  clickThroughByDefault: z
    .boolean()
    .default(false)
    .describe("Enable click-through by default."),
  performance,
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
export type MediaStyle = Config["media"]["style"];
export type TaskbarIntegration = Config["taskbarIntegration"];
export type Theme = Config["theme"];
export type WorkspaceStyle = Config["workspaces"]["style"];

export const defaultConfig = configSchema.parse({});
