<script lang="ts">
  import { leftSections } from "#lib/sections.ts";
  import { isSectionShown } from "#lib/state/layout.svelte.ts";
  import ConfigWarning from "./ConfigWarning.svelte";
  import { sectionComponents } from "./section_components.ts";
</script>

<div class="flex flex-row items-center gap-3">
  <ConfigWarning />
  {#each leftSections as id (id)}
    {#if isSectionShown(id)}
      {@const Section = sectionComponents[id]}
      <Section />
    {/if}
  {/each}
</div>
