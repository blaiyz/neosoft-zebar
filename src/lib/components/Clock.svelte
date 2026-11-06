<script lang="ts">
  import { config, updateSetting } from "#lib/state/config.svelte.ts";
  import { opensFlyout } from "#lib/state/flyouts.svelte.ts";
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
    preferPart("clock.date", fullDate === "preferred");
  });

  const toggleDate = async (event: MouseEvent) => {
    event.preventDefault();

    if (dateShown) {
      updateSetting("clock.fullDate", false);
      return;
    }

    // This tries it here before saving it, so that what can't show it leaves nothing
    // behind to show it later, and the other monitors don't see it either.
    const before = fullDate;
    fullDate = "preferred";
    await tick();
    if (partTarget("clock.date") === 0) fullDate = before;
    else updateSetting("clock.fullDate", "preferred");
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
  oncontextmenu={(event) => void toggleDate(event)}
  {@attach opensFlyout("calendar")}
>
  <p>
    {date?.new.toLocaleTimeString(undefined, timeOptions).toUpperCase()}
  </p>
  <Collapsible part="clock.date" when={fullDate !== false}>
    <p class="ml-1.5">- {date && formatDate(date.new)}</p>
  </Collapsible>
</button>
