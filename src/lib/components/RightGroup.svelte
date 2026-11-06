<script lang="ts">
  import { rightSections, sectionPart } from "#lib/sections.ts";
  import { isSectionShown, trackContent } from "#lib/state/layout.svelte.ts";
  import Collapsible from "./Collapsible.svelte";
  import { sectionComponents } from "./section_components.ts";
</script>

<div
  class="flex h-full w-max flex-none flex-row items-center"
  {@attach trackContent("right")}
>
  {#each rightSections as id (id)}
    {@const Section = sectionComponents[id]}
    <Collapsible part={sectionPart(id)} when={isSectionShown(id)}>
      <Section />
    </Collapsible>
  {/each}
</div>
