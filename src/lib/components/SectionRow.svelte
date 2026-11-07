<script lang="ts">
  import { pillSections, sectionPart, type BarItem } from "#lib/sections.ts";
  import { motion } from "#lib/state/motion.svelte.ts";
  import {
    isSectionShown,
    layout,
    trackContent
  } from "#lib/state/layout.svelte.ts";
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import { cubicOut } from "svelte/easing";
  import Arrival from "./Arrival.svelte";
  import BeadPill from "./BeadPill.svelte";
  import Collapsible from "./Collapsible.svelte";
  import ConfigWarning from "./ConfigWarning.svelte";
  import { sectionComponents } from "./section_components.ts";
  import Workspaces from "./Workspaces.svelte";

  type Props = {
    items: BarItem[];
    /** Which content of the bar this is, for fitting it. */
    content: Parameters<typeof trackContent>[0];
    /** Whether it starts with the warning about settings that were ignored. */
    warning?: boolean;
  };

  let { items, content, warning = false }: Props = $props();

  let pillShown = $derived(pillSections.some(isSectionShown));
  // The taskbar's room is part of the bar's middle, not of a row.
  let shown = $derived(items.filter((item) => item !== "taskbar"));

  const reorder = () => ({
    duration: layout.ready ? motion.duration : 0,
    easing: cubicOut
  });

  // An item arriving from another group opens up. One leaving goes at once: an
  // outro here can leave its element behind when the rows change again.
  let settled = $state(false);
  onMount(() => {
    settled = true;
  });
</script>

<!-- The spacing is inside what collapses, so nothing stays behind. Each item starts
     with it, and the negative margin takes it back off the first one. -->
<div
  class="-ml-3 flex h-full w-max flex-none flex-row items-center"
  {@attach trackContent(content)}
>
  {#if warning}<ConfigWarning />{/if}
  {#each shown as item (item)}
    <div class="flex h-full flex-none items-center" animate:flip={reorder()}>
      <Arrival late={settled && layout.ready}>
        {#if item === "buttons"}
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
        {:else if item === "workspaces"}
          <div class="flex h-full items-center has-[>*]:pl-3">
            <Workspaces />
          </div>
        {:else}
          {@const Section = sectionComponents[item]}
          <!-- The network's first part brings its own spacing, which it hides with. -->
          <Collapsible
            part={sectionPart(item)}
            when={isSectionShown(item)}
            class={item === "network" ? "" : "has-[>*]:pl-3"}
          >
            <Section />
          </Collapsible>
        {/if}
      </Arrival>
    </div>
  {/each}
</div>
