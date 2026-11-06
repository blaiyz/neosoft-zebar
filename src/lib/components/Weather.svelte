<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { isOnPrimaryMonitor } from "#lib/state/monitor.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import type { WeatherStatus } from "zebar";

  // Code points in the font that `src/app.css` loads.
  const STATUS_GLYPHS: Record<WeatherStatus, string> = {
    clear_day: "\u{e30d}",
    clear_night: "\u{e32b}",
    cloudy_day: "\u{e302}",
    cloudy_night: "\u{e37e}",
    light_rain_day: "\u{e30b}",
    light_rain_night: "\u{e328}",
    heavy_rain_day: "\u{e308}",
    heavy_rain_night: "\u{e325}",
    snow_day: "\u{e30a}",
    snow_night: "\u{e327}",
    thunder_day: "\u{e305}",
    thunder_night: "\u{e322}"
  };

  let weather = $derived(providers.weather);
  let useCelsius = $derived(config.weather.unit === "celsius");
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
        <i class="weather-icon">{STATUS_GLYPHS[weather.status]}</i>
      </span>
      {#if useCelsius}
        {Math.round(weather.celsiusTemp)}°C
      {:else}
        {Math.round(weather.fahrenheitTemp)}°F
      {/if}
    </div>
  </button>
{/if}
