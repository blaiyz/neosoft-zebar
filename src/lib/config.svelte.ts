import deepMergeObjects from "$lib/utils/deepmerge";
import defaultConfig from "$static/config.json";
import schema from "$static/schema.json";
import JSON5 from "json5";
import { Validator } from "jsonschema";

export interface Config {
  /**
   * The visual direction of the widget.
   *
   * `top`- The top of the widget has inverted corner radius, and the bottom has normal corner radius.
   *
   * `bottom`- The bottom of the widget has inverted corner radius, and the top has normal corner radius.
   *
   * `floating`- All corners of the widget have normal corner radius.
   */
  direction: AttachmentDirection;
  /**
   * The direction of the background gradient.
   *
   * `top`- From top to transparent bottom.
   *
   * `bottom`- From bottom to transparent top.
   *
   * `solid`- Solid color background.
   *
   * `disabled`- Background color is disabled.
   */
  gradient: GradientDirection;

  /**
   * Whether to attach the left and right sides of the widgets or to use smooth corners.
   *
   * To see the full corners, you must have some margin (`--bar-margin-x` in `config.css`)
   */
  attachSides: boolean;

  /**
   * Whether to integrate with the windows taskbar.
   *
   * Right now, this feature only adds an area at the center of the widget that contains the window icons. Please see README for more information.
   */
  taskbarIntegration: TaskbarIntegration;

  /**
   * The duration of transitions in milliseconds.
   */
  transitionDuration: number;

  /**
   * Options for the providers, including refresh intervals and error logging.
   */
  providersConfig: ProvidersConfig;

  /**
   * The background effect to use for the widget.
   *
   * NOTE: In order to use anything other than inherit, you must recompile zebar with an extra permission. More details in the README.
   *
   * `inherit`- Don't change the effect, and use the one defined in zpack.json (probably transparent).
   * `acrylic`- Use an acrylic background effect. Windows 10, 11.
   * `blur`- Use a blur background effect. Windows 10, 11.
   * `mica`- Use a mica background effect. Windows 11 only.
   */
  backgroundEffect: BackgroundEffect;

  /**
   * Whether to enable built-in automatic tiling of windows.
   */
  enableAutoTiling: boolean;

  /**
   * Whether to show the full date by default instead of just the time.
   *
   * (This can be toggled in the UI by clicking the date/time)
   */
  showFullDateByDefault: boolean;

  /**
   * Enable click-through by default.
   */
  clickThroughByDefault: boolean;

  /**
   * Enable volume slider by default.
   */
  enableVolumeSlider: boolean;

  // Individual section toggles

  showHeartButton: boolean;
  showCpuSection: boolean;
  showMemorySection: boolean;
  showBatterySection: boolean;
  showNetworkSection: boolean;
  showWeatherSection: boolean;
}

export type AttachmentDirection = "top" | "bottom" | "floating";

export type GradientDirection = "top" | "bottom" | "solid" | "disabled";

export interface TaskbarIntegration {
  /**
   * Whether to integrate with the windows taskbar.
   */
  enabled: boolean;
  /**
   * The number of additional icons that appear in the taskbar (like windows logo or search).
   */
  extraIcons: number;

  /**
   * Which windows to include in the number of taskbar icons.
   */
  primaryMonitorSelection: WindowSelection;
  secondaryMonitorSelection: WindowSelection;
}

export type WindowSelection = "workspace" | "monitor" | "all";

export interface ProvidersConfig {
  /**
   * The refresh intervals for some providers.
   */
  refreshIntervals: RefreshIntervals;

  /**
   * Whether to enable error logging for providers.
   */
  enableErrorLogging: boolean;
}

export type RefreshIntervals = {
  cpu: number;
  memory: number;
  battery: number;
  weather: number;
  network: number;
};

export type BackgroundEffect = "inherit" | "acrylic" | "blur" | "mica";

const config = $state(defaultConfig as Config);
const validator = new Validator();

let configLoadedResolve: (value: Config) => void;
let configLoadedReject: (reason?: Error) => void;

const configLoaded = new Promise<Config>((resolve, reject) => {
  configLoadedResolve = resolve;
  configLoadedReject = reject;
});

function loadConfig() {
  console.log("Fetching config...");
  fetch("config.json")
    .then((response) => response.text())
    .then((data) => {
      const newConfig = JSON5.parse(data);
      const result = validator.validate(newConfig, schema);
      if (!result.valid) {
        console.error("Config validation failed:", result.errors);
        throw new Error("Config validation failed");
      }
      Object.assign(config, deepMergeObjects(config, newConfig));
      console.log("Config loaded:", data);
      configLoadedResolve(config);
    })
    .catch((error) => {
      console.error("Error loading config:", error);
      configLoadedReject(error);
    });
}

export { config, configLoaded, loadConfig };
