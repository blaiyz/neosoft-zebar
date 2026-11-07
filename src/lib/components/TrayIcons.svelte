<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { opensFlyout } from "#lib/state/flyouts.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { arrangeTray } from "#lib/utils/tray.ts";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import AnimatedList from "./AnimatedList.svelte";
  import TrayIconButton from "./TrayIconButton.svelte";

  let systray = $derived(providers.systray);
  let pinned = $derived(
    arrangeTray(systray?.icons ?? [], config.tray.pinned).filter(({ key }) =>
      config.tray.pinned.includes(key)
    )
  );
</script>

{#if systray}
  <div class="mr-1 flex h-full items-center">
    <AnimatedList items={pinned} key={({ key }: { key: string }) => key}>
      {#snippet item({ icon })}
        <TrayIconButton {icon} class="mx-1 transition hover:scale-125" />
      {/snippet}
    </AnimatedList>
    <button
      class="ml-1 flex h-full items-center text-lg transition hover:text-zb-accent"
      aria-label="System tray"
      {@attach opensFlyout("tray")}
    >
      <ChevronUp class={[config.bar.direction === "top" && "rotate-180"]} />
    </button>
  </div>
{/if}
