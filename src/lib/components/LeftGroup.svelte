<script lang="ts">
  import { leftSections } from "#lib/sections.ts";
  import { isSectionShown, trackContent } from "#lib/state/layout.svelte.ts";
  import Collapsible from "./Collapsible.svelte";
  import ConfigWarning from "./ConfigWarning.svelte";
  import { sectionComponents } from "./section_components.ts";
</script>

<!-- The spacing is inside what collapses, so nothing stays behind. Each section starts
     with it, and the negative margin takes it back off the first one. -->
<div
  class="-ml-3 flex h-full w-max flex-none flex-row items-center"
  {@attach trackContent("left")}
>
  <ConfigWarning />
  {#each leftSections as id (id)}
    {#if isSectionShown(id)}
      {@const Section = sectionComponents[id]}
      {#if id === "network"}
        <Section />
      {:else}
        <Collapsible part={id} class="has-[>*]:pl-3">
          <Section />
        </Collapsible>
      {/if}
    {/if}
  {/each}
</div>
