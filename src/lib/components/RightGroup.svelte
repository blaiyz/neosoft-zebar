<script lang="ts">
  import { rightSections } from "#lib/sections.ts";
  import { isSectionShown } from "#lib/state/layout.svelte.ts";
  import { sectionComponents } from "./section_components.ts";
</script>

<div class="flex h-full flex-row items-center">
  {#each rightSections as id (id)}
    {#if isSectionShown(id)}
      {@const Section = sectionComponents[id]}
      <Section />
    {/if}
  {/each}
</div>
