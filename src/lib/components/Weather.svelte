<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { isOnPrimaryMonitor } from "#lib/state/monitor.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import type { WeatherStatus } from "zebar";

  const STATUS_ICONS: Record<WeatherStatus, string> = {
    clear_day: "nf-weather-day_sunny",
    clear_night: "nf-weather-night_clear",
    cloudy_day: "nf-weather-day_cloudy",
    cloudy_night: "nf-weather-night_alt_cloudy",
    light_rain_day: "nf-weather-day_sprinkle",
    light_rain_night: "nf-weather-night_alt_sprinkle",
    heavy_rain_day: "nf-weather-day_rain",
    heavy_rain_night: "nf-weather-night_alt_rain",
    snow_day: "nf-weather-day_snow",
    snow_night: "nf-weather-night_alt_snow",
    thunder_day: "nf-weather-day_lightning",
    thunder_night: "nf-weather-night_alt_lightning"
  };

  let weather = $derived(providers.weather);
  let useCelsius = $derived(config.useCelsiusByDefault);
</script>

{#if weather}
  <button
    class="hover:text-zb-accent"
    onclick={() => (useCelsius = !useCelsius)}
  >
    <div
      class={[
        "flex items-center truncate pr-2",
        !isOnPrimaryMonitor() && "pl-1"
      ]}
    >
      <span class="text-2xl">
        <i class={["nf", STATUS_ICONS[weather.status]]}></i>
      </span>
      {#if useCelsius}
        {Math.round(weather.celsiusTemp)}°C
      {:else}
        {Math.round(weather.fahrenheitTemp)}°F
      {/if}
    </div>
  </button>
{/if}
