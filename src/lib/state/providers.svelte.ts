import type { Config } from "#lib/config_schema.ts";
import { configLoaded } from "#lib/state/config.svelte.ts";
import {
  createProviderGroup,
  type ProviderGroup,
  type ProviderGroupConfig
} from "zebar";

/** Sections that can be turned off take their providers with them. */
function createProviderConfig(config: Config) {
  const { refreshIntervals } = config.providersConfig;

  return {
    date: { type: "date" },
    glazewm: { type: "glazewm" },
    media: { type: "media" },
    audio: { type: "audio" },
    ...(config.showBatterySection && {
      battery: {
        type: "battery" as const,
        refreshInterval: refreshIntervals.battery
      }
    }),
    ...(config.showCpuSection && {
      cpu: { type: "cpu" as const, refreshInterval: refreshIntervals.cpu }
    }),
    ...(config.showMemorySection && {
      memory: {
        type: "memory" as const,
        refreshInterval: refreshIntervals.memory
      }
    }),
    ...(config.showNetworkSection !== false && {
      network: {
        type: "network" as const,
        refreshInterval: refreshIntervals.network
      }
    }),
    ...(config.showWeatherSection && {
      weather: {
        type: "weather" as const,
        refreshInterval: refreshIntervals.weather
      }
    })
  } satisfies ProviderGroupConfig;
}

type ProviderConfig = Required<ReturnType<typeof createProviderConfig>>;

const providers: ProviderGroup<ProviderConfig>["outputMap"] = $state({
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

async function initProviders() {
  const config = await configLoaded;
  const providerGroup = createProviderGroup(createProviderConfig(config));

  providerGroup.onOutput((outputMap) => {
    Object.assign(providers, outputMap);
  });

  if (config.providersConfig.enableErrorLogging) {
    providerGroup.onError((error) => {
      console.error("Provider error:", error);
    });
  }
}

export { initProviders, providers };
