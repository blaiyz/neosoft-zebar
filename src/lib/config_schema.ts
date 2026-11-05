import * as z from "zod";

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
    secondaryMonitorSelection: windowSelection.default("monitor")
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

const providersConfig = z
  .object({
    refreshIntervals: refreshIntervals.describe(
      "The refresh intervals for some providers."
    ),
    enableErrorLogging: z
      .boolean()
      .default(false)
      .describe("Whether to enable error logging for providers.")
  })
  .prefault({});

/**
 * The options in `config.json`, with their defaults. Every key has a default, so
 * a partial file is valid, and unknown keys are dropped rather than rejected. The
 * descriptions become the editor hints in `schema.json`.
 */
export const configSchema = z.object({
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
        "To see the full corners, you must have some margin (`--bar-margin-x` in `config.css`)"
      ].join("\n\n")
    ),
  taskbarIntegration: taskbarIntegration.describe(
    [
      "Whether to integrate with the windows taskbar.",
      "Right now, this feature only adds an area at the center of the widget that contains the window icons. Please see README for more information."
    ].join("\n\n")
  ),
  transitionDuration: z
    .number()
    .default(400)
    .describe("The duration of transitions in milliseconds."),
  providersConfig: providersConfig.describe(
    "Options for the providers, including refresh intervals and error logging."
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
  enableAutoTiling: z
    .boolean()
    .default(true)
    .describe("Whether to enable built-in automatic tiling of windows."),
  showFullDateByDefault: z
    .boolean()
    .default(false)
    .describe(
      [
        "Whether to show the full date by default instead of just the time.",
        "(This can be toggled in the UI by clicking the date/time)"
      ].join("\n\n")
    ),
  clickThroughByDefault: z
    .boolean()
    .default(false)
    .describe("Enable click-through by default."),
  extendVolumeSliderByDefault: z
    .boolean()
    .default(false)
    .describe("Enable volume slider by default."),
  showHeartButton: z.boolean().default(true),
  showCpuSection: z.boolean().default(true),
  showMemorySection: z.boolean().default(true),
  showBatterySection: z.boolean().default(true),
  showNetworkSection: z
    .literal([true, false, "interface", "statistics"])
    .default(true),
  showWeatherSection: z.boolean().default(true),
  showShutdownButton: z.boolean().default(true),
  useCelsiusByDefault: z.boolean().default(true),
  use24hClock: z.literal([true, false, "auto"]).default("auto"),
  showSeconds: z.boolean().default(false),
  useThinnerWorkspaceButtons: z.boolean().default(false)
});

export type Config = z.infer<typeof configSchema>;
export type AttachmentDirection = Config["direction"];
export type TaskbarIntegration = Config["taskbarIntegration"];
export type BackgroundEffect = Config["backgroundEffect"];

export const defaultConfig = configSchema.parse({});
