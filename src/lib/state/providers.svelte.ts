import type { Config } from "#lib/config_schema.ts";
import { config, configStatus } from "#lib/state/config.svelte.ts";
import { motion } from "#lib/state/motion.svelte.ts";
import { untrack } from "svelte";
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

/**
 * Every output is replaced whole and never changed, so only the outputs themselves
 * are reactive. A deep proxy would wrap each new one again on every reading.
 */
class Outputs implements ProviderOutputs {
  battery: ProviderOutputs["battery"] = $state.raw(null);
  cpu: ProviderOutputs["cpu"] = $state.raw(null);
  date: ProviderOutputs["date"] = $state.raw(null);
  glazewm: ProviderOutputs["glazewm"] = $state.raw(null);
  memory: ProviderOutputs["memory"] = $state.raw(null);
  network: ProviderOutputs["network"] = $state.raw(null);
  weather: ProviderOutputs["weather"] = $state.raw(null);
  media: ProviderOutputs["media"] = $state.raw(null);
  audio: ProviderOutputs["audio"] = $state.raw(null);
  systray: ProviderOutputs["systray"] = $state.raw(null);
  disk: ProviderOutputs["disk"] = $state.raw(null);
  host: ProviderOutputs["host"] = $state.raw(null);
  keyboard: ProviderOutputs["keyboard"] = $state.raw(null);
}

const providers: ProviderOutputs = new Outputs();

// Nothing reads this reactively.
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const running = new Map<
  ProviderName,
  { key: string; stop: () => Promise<void> }
>();

function setOutput<Name extends ProviderName>(
  name: Name,
  output: ProviderOutputs[Name]
) {
  providers[name] = output;
}

/** The last output stays for as long as its section takes to close. */
function clearOutput(name: ProviderName) {
  setTimeout(
    () => {
      if (!running.has(name)) setOutput(name, null);
    },
    untrack(() => motion.duration)
  );
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

  running.set(name, { key, stop: () => provider.stop() });
}

/**
 * Restarts only what changed. Stopping them all for any change would empty
 * `providers.glazewm` and take the workspaces with it.
 */
function syncProviders(
  available: Partial<ProviderConfig>,
  wanted: readonly ProviderName[]
) {
  for (const name of new Set([...running.keys(), ...wanted])) {
    const providerConfig = wanted.includes(name) ? available[name] : undefined;
    const key = providerConfig && JSON.stringify(providerConfig);
    const current = running.get(name);
    if (current?.key === key) continue;

    if (current) {
      // Zebar runs one provider for each config, shared by every window that asks
      // for it, and the first window to stop it stops it for all of them. The
      // others' stops then fail, which is expected.
      current.stop().catch(() => {});
      running.delete(name);
    }
    if (providerConfig && key) startProvider(name, providerConfig, key);
    else if (current) clearOutput(name);
  }
}

/**
 * What the bar itself shows, and the disks whatever the bar shows, since the
 * flyouts read them too. Zebar stops a provider for every window at once, so a
 * window must never stop one that another still wants.
 */
const barProviders: readonly ProviderName[] = [
  "audio",
  "battery",
  "cpu",
  "date",
  "disk",
  "glazewm",
  "keyboard",
  "media",
  "memory",
  "network",
  "systray",
  "weather"
];

/**
 * Call while a component initializes. A window starts the providers in `wanted`,
 * except for those that the sections they belong to have turned off.
 */
function initProviders(wanted: readonly ProviderName[]) {
  $effect(() => {
    if (configStatus.loaded)
      syncProviders(createProviderConfig(config), wanted);
  });
}

export { barProviders, initProviders, providers };
