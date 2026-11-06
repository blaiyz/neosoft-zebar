<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { partTarget, preferPart } from "#lib/state/layout.svelte.ts";
  import { formatDate } from "#lib/utils/format.ts";
  import PointFilled from "@tabler/icons-svelte/icons/point-filled";
  import { tick } from "svelte";
  import Collapsible from "./Collapsible.svelte";

  let date = $derived(providers.date);
  let fullDate = $derived(config.clock.fullDate);
  let dateShown = $derived(
    fullDate !== false && partTarget("clock.date") !== 0
  );

  $effect(() => {
    preferPart("clock.date", fullDate === true);
  });

  const toggleDate = async () => {
    if (dateShown) {
      fullDate = false;
      return;
    }

    // A click that can't show it leaves nothing behind to show it later.
    const before = fullDate;
    fullDate = true;
    await tick();
    if (partTarget("clock.date") === 0) fullDate = before;
  };

  let timeOptions: Intl.DateTimeFormatOptions = $derived({
    hour: "numeric",
    minute: "2-digit",
    ...(config.clock.use24h === "auto"
      ? {}
      : config.clock.use24h
        ? { hour12: false }
        : { hour12: true }),
    ...(config.clock.showSeconds ? { second: "numeric" } : {})
  });
</script>

<PointFilled class="mr-2" />
<button
  class="flex h-full items-center whitespace-nowrap tabular-nums hover:text-zb-accent"
  onclick={() => void toggleDate()}
>
  <p>
    {date?.new.toLocaleTimeString(undefined, timeOptions).toUpperCase()}
  </p>
  <Collapsible part="clock.date" when={fullDate !== false}>
    <p class="ml-1.5">- {date && formatDate(date.new)}</p>
  </Collapsible>
</button>
