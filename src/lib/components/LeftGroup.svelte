<script lang="ts">
  import { meterSections, pillSections, sectionPart } from "#lib/sections.ts";
  import { isSectionShown, trackContent } from "#lib/state/layout.svelte.ts";
  import BeadPill from "./BeadPill.svelte";
  import Collapsible from "./Collapsible.svelte";
  import ConfigWarning from "./ConfigWarning.svelte";
  import { sectionComponents } from "./section_components.ts";

  let pillShown = $derived(pillSections.some(isSectionShown));
</script>

<!-- The spacing is inside what collapses, so nothing stays behind. Each section starts
     with it, and the negative margin takes it back off the first one. -->
<div
  class="-ml-3 flex h-full w-max flex-none flex-row items-center"
  {@attach trackContent("left")}
>
  <ConfigWarning />
  <Collapsible when={pillShown}>
    <div class="flex h-full flex-none items-center pl-3">
      <BeadPill>
        {#each pillSections as id (id)}
          {@const Section = sectionComponents[id]}
          <Collapsible part={sectionPart(id)} when={isSectionShown(id)}>
            <Section />
          </Collapsible>
        {/each}
      </BeadPill>
    </div>
  </Collapsible>
  {#each meterSections as id (id)}
    {@const Section = sectionComponents[id]}
    <Collapsible
      part={sectionPart(id)}
      when={isSectionShown(id)}
      class={id === "network" ? "" : "has-[>*]:pl-3"}
    >
      <Section />
    </Collapsible>
  {/each}
</div>
