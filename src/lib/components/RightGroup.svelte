<script lang="ts">
  import { rightSections } from "#lib/sections.ts";
  import { isSectionShown, trackContent } from "#lib/state/layout.svelte.ts";
  import Collapsible from "./Collapsible.svelte";
  import { sectionComponents } from "./section_components.ts";
</script>

<div
  class="flex h-full w-max flex-none flex-row items-center"
  {@attach trackContent("right")}
>
  {#each rightSections as id (id)}
    {#if isSectionShown(id)}
      {@const Section = sectionComponents[id]}
      {#if id === "weather"}
        <Collapsible part="weather">
          <Section />
        </Collapsible>
      {:else}
        <Section />
      {/if}
    {/if}
  {/each}
</div>
