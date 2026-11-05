import {
  configSchema,
  defaultConfig,
  type Config
} from "#lib/config_schema.ts";
import JSON5 from "json5";

const config = $state(defaultConfig);

let configLoadedResolve: (value: Config) => void;

/** Resolves once the user's file is applied, or with the defaults if it can't be. */
const configLoaded = new Promise<Config>((resolve) => {
  configLoadedResolve = resolve;
});

async function loadConfig() {
  try {
    const response = await fetch("config.json");
    const data = await response.text();
    Object.assign(config, configSchema.parse(JSON5.parse(data)));
  } catch (error) {
    console.error("Error loading config:", error);
  }
  configLoadedResolve(config);
}

export { config, configLoaded, loadConfig };
