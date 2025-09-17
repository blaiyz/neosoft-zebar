<script lang="ts">
  import { config } from "$lib/config.svelte";
  import { providers } from "$lib/providers.svelte";
  import { isOnPrimaryMonitor } from "$lib/utils/glaze_wm_utils.svelte";
  import PointFilled from "@tabler/icons-svelte/icons/point-filled";
  import NowPlaying from "./NowPlaying.svelte";
  import SmoothDiv from "./SmoothDiv.svelte";
  import VolumeControl from "./VolumeControl/VolumeControl.svelte";

  let date = $derived(providers.date);
  let weather = $derived(providers.weather);

  let fullDate = $derived(config.showFullDateByDefault);
  const getDate = (date: Date) => {
    const days = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];
    const shortDay = days[date.getDay()];
    return shortDay + " " + date.toLocaleDateString();
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit"
  };
</script>

<div class="flex flex-row items-center h-full">
  <NowPlaying />
  {#if isOnPrimaryMonitor()}
    <VolumeControl />
  {/if}
  {#if weather}
    <div
      class="truncate flex items-center pr-2 {!isOnPrimaryMonitor()
        ? 'pl-2'
        : ''}"
    >
      <span class="text-2xl">
        {#if weather.status === "clear_day"}
          <i class="nf nf-weather-day_sunny"></i>
        {:else if weather.status === "clear_night"}
          <i class="nf nf-weather-night_clear"></i>
        {:else if weather.status === "cloudy_day"}
          <i class="nf nf-weather-day_cloudy"></i>
        {:else if weather.status === "cloudy_night"}
          <i class="nf nf-weather-night_alt_cloudy"></i>
        {:else if weather.status === "light_rain_day"}
          <i class="nf nf-weather-day_sprinkle"></i>
        {:else if weather.status === "light_rain_night"}
          <i class="nf nf-weather-night_alt_sprinkle"></i>
        {:else if weather.status === "heavy_rain_day"}
          <i class="nf nf-weather-day_rain"></i>
        {:else if weather.status === "heavy_rain_night"}
          <i class="nf nf-weather-night_alt_rain"></i>
        {:else if weather.status === "snow_day"}
          <i class="nf nf-weather-day_snow"></i>
        {:else if weather.status === "snow_night"}
          <i class="nf nf-weather-night_alt_snow"></i>
        {:else if weather.status === "thunder_day"}
          <i class="nf nf-weather-day_lightning"></i>
        {:else if weather.status === "thunder_night"}
          <i class="nf nf-weather-night_alt_lightning"></i>
        {/if}
      </span>
      {Math.round(weather.celsiusTemp)}°
    </div>
  {/if}
  {#if !isOnPrimaryMonitor() || !config.taskbarIntegration.enabled}
    <PointFilled class="mr-2" />
    <SmoothDiv outerClass="flex items-stretch h-full overflow-hidden">
      <button
        class="hover:text-zb-accent"
        onclick={() => (fullDate = !fullDate)}
      >
        <p class="whitespace-nowrap">
          {date?.new.toLocaleTimeString(undefined, timeOptions)}
          {#if fullDate}
            -
            {date && getDate(date?.new)}
          {/if}
        </p>
      </button>
    </SmoothDiv>
  {/if}
</div>
