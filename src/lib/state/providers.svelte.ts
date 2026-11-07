import type { Config } from "#lib/config_schema.ts";
import { config, configStatus } from "#lib/state/config.svelte.ts";
import {
  createProvider,
  type ProviderGroup,
  type ProviderGroupConfig
} from "zebar";

/** Only `false` skips a provider, because `auto` may show its section at any time. */
function createProviderConfig({ sections, providers }: Config) {
  const { refreshIntervals } = providers;

  return {
    date: { type: "date" },
    glazewm: { type: "glazewm" },
    ...(sections.media !== false && { media: { type: "media" as const } }),
    ...(sections.volume !== false && { audio: { type: "audio" as const } }),
    ...(sections.battery !== false && {
      battery: {
        type: "battery" as const,
        refreshInterval: refreshIntervals.battery
      }
    }),
    ...(sections.cpu !== false && {
      cpu: { type: "cpu" as const, refreshInterval: refreshIntervals.cpu }
    }),
    ...(sections.memory !== false && {
      memory: {
        type: "memory" as const,
        refreshInterval: refreshIntervals.memory
      }
    }),
    ...(sections.network !== false && {
      network: {
        type: "network" as const,
        refreshInterval: refreshIntervals.network
      }
    }),
    ...(sections.weather !== false && {
      weather: {
        type: "weather" as const,
        refreshInterval: refreshIntervals.weather
      }
    }),
    ...(sections.tray !== false && { systray: { type: "systray" as const } }),
    ...(sections.keyboard !== false && {
      keyboard: {
        type: "keyboard" as const,
        refreshInterval: refreshIntervals.keyboard
      }
    }),
    disk: { type: "disk", refreshInterval: refreshIntervals.disk },
    host: { type: "host" }
  } satisfies ProviderGroupConfig;
}

type ProviderConfig = Required<ReturnType<typeof createProviderConfig>>;
export type ProviderName = keyof ProviderConfig;
type ProviderOutputs = ProviderGroup<ProviderConfig>["outputMap"];

const providers: ProviderOutputs = $state({
  battery: null,
  cpu: null,
  date: null,
  glazewm: null,
  memory: null,
  network: null,
  weather: null,
  media: null,
  audio: null,
  systray: null,
  disk: null,
  host: null,
  keyboard: null
});

const running: Partial<
  Record<ProviderName, { key: string; stop: () => Promise<void> }>
> = {};

function setOutput<Name extends ProviderName>(
  name: Name,
  output: ProviderOutputs[Name]
) {
  providers[name] = output;
}

/** The last output stays for as long as its section takes to close. */
function clearOutput(name: ProviderName) {
  setTimeout(() => {
    if (!running[name]) setOutput(name, null);
  }, config.bar.transitionDuration);
}

function startProvider<Name extends ProviderName>(
  name: Name,
  providerConfig: ProviderConfig[Name],
  key: string
) {
  const provider = createProvider(providerConfig);

  provider.onOutput(() => {
    setOutput(name, provider.output as ProviderOutputs[Name]);
  });
  provider.onError((error) => {
    setOutput(name, null);
    if (config.providers.logErrors) {
      console.error(`Provider error (${name}):`, error);
    }
  });

  running[name] = { key, stop: () => provider.stop() };
}

/**
 * Restarts only what changed. Stopping them all for any change would empty
 * `providers.glazewm` and take the workspaces with it.
 */
function syncProviders(
  available: Partial<ProviderConfig>,
  wanted: readonly ProviderName[]
) {
  const names = Object.keys(providers) as ProviderName[];

  for (const name of names) {
    const providerConfig = wanted.includes(name) ? available[name] : undefined;
    const key = providerConfig && JSON.stringify(providerConfig);
    const current = running[name];
    if (current?.key === key) continue;

    if (current) {
      // Zebar runs one provider for each config, shared by every window that asks
      // for it, and the first window to stop it stops it for all of them. The
      // others' stops then fail, which is expected.
      current.stop().catch(() => {});
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete running[name];
    }
    if (providerConfig && key) startProvider(name, providerConfig, key);
    else if (current) clearOutput(name);
  }
}

/** What the bar itself shows. The flyouts read the disks whatever the bar shows. */
const barProviders = ({ sections }: Config): ProviderName[] => [
  "audio",
  "battery",
  "cpu",
  "date",
  "glazewm",
  "keyboard",
  "media",
  "memory",
  "network",
  "systray",
  "weather",
  ...(sections.disk === false ? [] : ["disk" as const])
];

/**
 * Call while a component initializes. A window starts the providers in `wanted`,
 * except for those that the sections they belong to have turned off.
 */
function initProviders(
  wanted: readonly ProviderName[] | ((config: Config) => ProviderName[])
) {
  $effect(() => {
    if (configStatus.loaded) {
      syncProviders(
        createProviderConfig(config),
        typeof wanted === "function" ? wanted(config) : wanted
      );
    }
  });
}

export { barProviders, initProviders, providers };
