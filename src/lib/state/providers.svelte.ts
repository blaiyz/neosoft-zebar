import type { Config } from "#lib/config_schema.ts";
import { configLoaded } from "#lib/state/config.svelte.ts";
import {
  createProviderGroup,
  type ProviderGroup,
  type ProviderGroupConfig
} from "zebar";

type RefreshIntervals = Config["providersConfig"]["refreshIntervals"];

function createProviderConfig(refreshIntervals: RefreshIntervals) {
  return {
    battery: { type: "battery", refreshInterval: refreshIntervals.battery },
    cpu: { type: "cpu", refreshInterval: refreshIntervals.cpu },
    date: { type: "date" },
    glazewm: { type: "glazewm" },
    memory: { type: "memory", refreshInterval: refreshIntervals.memory },
    network: { type: "network", refreshInterval: refreshIntervals.network },
    weather: { type: "weather", refreshInterval: refreshIntervals.weather },
    media: { type: "media" },
    audio: { type: "audio" }
  } satisfies ProviderGroupConfig;
}

type ProviderConfig = ReturnType<typeof createProviderConfig>;

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
  const { providersConfig } = await configLoaded;
  const providerGroup = createProviderGroup(
    createProviderConfig(providersConfig.refreshIntervals)
  );

  providerGroup.onOutput((outputMap) => {
    Object.assign(providers, outputMap);
  });

  if (providersConfig.enableErrorLogging) {
    providerGroup.onError((error) => {
      console.error("Provider error:", error);
    });
  }
}

export { initProviders, providers };
