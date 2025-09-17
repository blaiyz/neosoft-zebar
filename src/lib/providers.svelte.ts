import {
  createProviderGroup,
  type ProviderGroup,
  type ProviderGroupConfig
} from "zebar";
import { configLoaded, type Config } from "./config.svelte";

const providerConfig = {
  battery: { type: "battery", refreshInterval: 1000 * 60 * 1 }, // 1 minute
  cpu: { type: "cpu", refreshInterval: 2000 },
  date: { type: "date" },
  glazewm: { type: "glazewm" },
  memory: { type: "memory", refreshInterval: 5000 },
  network: { type: "network", refreshInterval: 2000 },
  weather: { type: "weather", refreshInterval: 1000 * 60 * 15 }, // 15 minutes
  media: { type: "media" },
  audio: { type: "audio" }
} satisfies ProviderGroupConfig;

const providers: ProviderGroup<typeof providerConfig>["outputMap"] = $state({
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
  let config: Config | null = null;
  try {
    config = await configLoaded;
    const refreshIntervals = config.providersConfig.refreshIntervals;
    providerConfig.cpu.refreshInterval = refreshIntervals.cpu;
    providerConfig.memory.refreshInterval = refreshIntervals.memory;
    providerConfig.battery.refreshInterval = refreshIntervals.battery;
    providerConfig.weather.refreshInterval = refreshIntervals.weather;
    providerConfig.network.refreshInterval = refreshIntervals.network;
  } catch (error) {
    console.error("Error initializing providers:", error);
    // Can continue with default config
  }

  const providerGroup = createProviderGroup(providerConfig);

  providerGroup.onOutput((outputMap) => {
    Object.assign(providers, outputMap);
  });

  if (config?.providersConfig.enableErrorLogging) {
    providerGroup.onError((error) => {
      console.error("Provider error:", error);
    });
  }
}

export { initProviders, providers };
