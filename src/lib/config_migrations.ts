import { isDocument, type ConfigDocument } from "./config_document.ts";
import { CONFIG_VERSION } from "./config_schema.ts";

function setPath(document: ConfigDocument, path: string, value: unknown) {
  const keys = path.split(".");
  const last = keys.pop() as string;
  let parent = document;
  for (const key of keys) {
    const child = parent[key];
    parent = isDocument(child) ? child : (parent[key] = {});
  }
  parent[last] = value;
}

/** Renamed keys, with the value kept as it is. */
const V1_MOVES: Record<string, string> = {
  direction: "bar.direction",
  gradient: "bar.gradient",
  attachSides: "bar.attachSides",
  backgroundEffect: "bar.backgroundEffect",
  transitionDuration: "bar.transitionDuration",
  enableAutoTiling: "autoTiling",
  extendVolumeSliderByDefault: "volume.sliderOpen",
  use24hClock: "clock.use24h",
  showSeconds: "clock.showSeconds"
};

/**
 * Keys that were `true` by default. Every v1 file repeated them, so `true` only
 * means the user left them alone, and moving it across would pin them and hide the
 * new `auto` default. Any other value is a choice, and is kept.
 */
const V1_SHOWN_BY_DEFAULT: Record<string, string> = {
  showShutdownButton: "sections.power",
  showHeartButton: "sections.heart",
  showCpuSection: "sections.cpu",
  showMemorySection: "sections.memory",
  showBatterySection: "sections.battery",
  showNetworkSection: "sections.network",
  showWeatherSection: "sections.weather"
};

/** The same for options that were `false` by default. */
const V1_HIDDEN_BY_DEFAULT: Record<string, string> = {
  useThinnerWorkspaceButtons: "workspaces.thinButtons",
  showFullDateByDefault: "clock.fullDate"
};

function fromV1(document: ConfigDocument): ConfigDocument {
  const migrated = { ...document };

  const take = (key: string) => {
    const value = migrated[key];
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete migrated[key];
    return value;
  };

  for (const [key, path] of Object.entries(V1_MOVES)) {
    if (key in migrated) setPath(migrated, path, take(key));
  }
  for (const [key, path] of Object.entries(V1_SHOWN_BY_DEFAULT)) {
    const value = take(key);
    if (value !== undefined && value !== true) setPath(migrated, path, value);
  }
  for (const [key, path] of Object.entries(V1_HIDDEN_BY_DEFAULT)) {
    const value = take(key);
    if (value !== undefined && value !== false) setPath(migrated, path, value);
  }

  if (take("useCelsiusByDefault") === false) {
    setPath(migrated, "weather.unit", "fahrenheit");
  }

  const providers = take("providersConfig");
  if (isDocument(providers)) {
    const { refreshIntervals, enableErrorLogging } = providers;
    if (refreshIntervals !== undefined) {
      setPath(migrated, "providers.refreshIntervals", refreshIntervals);
    }
    if (enableErrorLogging !== undefined) {
      setPath(migrated, "providers.logErrors", enableErrorLogging);
    }
  }

  return migrated;
}

/** Each step upgrades a document from the version it's listed under to the next. */
const MIGRATIONS: Record<number, (document: ConfigDocument) => ConfigDocument> =
  {
    1: fromV1
  };

/**
 * Upgrades a document to the current version. A document without a version is
 * treated as v1, because v1 files had none. Keys that are already in the current
 * format pass through, so a hand-written file works without one too.
 */
export function migrate(input: ConfigDocument): ConfigDocument {
  let document = structuredClone(input);
  delete document.$schema;

  const start = typeof document.version === "number" ? document.version : 1;
  for (let version = start; version < CONFIG_VERSION; version++) {
    const step = MIGRATIONS[version];
    if (step) document = step(document);
  }

  return { ...document, version: Math.max(start, CONFIG_VERSION) };
}
