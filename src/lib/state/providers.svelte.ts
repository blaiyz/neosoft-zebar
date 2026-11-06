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
    })
  } satisfies ProviderGroupConfig;
}

type ProviderConfig = Required<ReturnType<typeof createProviderConfig>>;
type ProviderName = keyof ProviderConfig;
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
  audio: null
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
function syncProviders(wanted: Partial<ProviderConfig>) {
  const names = Object.keys(providers) as ProviderName[];

  for (const name of names) {
    const providerConfig = wanted[name];
    const key = providerConfig && JSON.stringify(providerConfig);
    const current = running[name];
    if (current?.key === key) continue;

    if (current) {
      void current.stop();
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete running[name];
      setOutput(name, null);
    }
    if (providerConfig && key) startProvider(name, providerConfig, key);
  }
}

/** Call while a component initializes. */
function initProviders() {
  $effect(() => {
    if (configStatus.loaded) syncProviders(createProviderConfig(config));
  });
}

export { initProviders, providers };
