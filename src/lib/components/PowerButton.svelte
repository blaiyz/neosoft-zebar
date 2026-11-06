<script lang="ts">
  import { opensFlyout } from "#lib/state/flyouts.svelte.ts";
  import { pendingPower } from "#lib/state/power.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import IconPowerButton from "@tabler/icons-svelte/icons/power";
  import BeadButton from "./BeadButton.svelte";

  let now = $derived(providers.date?.new.getTime() ?? 0);
  let pending = $derived((pendingPower.value?.at ?? 0) > now);
</script>

<BeadButton
  class={pending ? "animate-pulse" : ""}
  label="Power"
  tone={pending ? "--accent" : "--memory"}
  {@attach opensFlyout("power")}
>
  <IconPowerButton />
</BeadButton>
