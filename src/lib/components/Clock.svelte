<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { formatDate } from "#lib/utils/format.ts";
  import PointFilled from "@tabler/icons-svelte/icons/point-filled";
  import Reveal from "./Reveal.svelte";

  let date = $derived(providers.date);
  let fullDate = $derived(config.showFullDateByDefault);

  let timeOptions: Intl.DateTimeFormatOptions = $derived({
    hour: "numeric",
    minute: "2-digit",
    ...(config.use24hClock === "auto"
      ? {}
      : config.use24hClock
        ? { hour12: false }
        : { hour12: true }),
    ...(config.showSeconds ? { second: "numeric" } : {})
  });
</script>

<PointFilled class="mr-2" />
<Reveal class="overflow-hidden">
  <button
    class="h-full hover:text-zb-accent"
    onclick={() => (fullDate = !fullDate)}
  >
    <p class="whitespace-nowrap tabular-nums">
      {date?.new.toLocaleTimeString(undefined, timeOptions).toUpperCase()}
      {#if fullDate}
        -
        {date && formatDate(date.new)}
      {/if}
    </p>
  </button>
</Reveal>
