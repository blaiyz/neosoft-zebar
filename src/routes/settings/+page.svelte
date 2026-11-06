<script lang="ts">
  import AppearancePage from "#lib/components/settings/AppearancePage.svelte";
  import ConfigPage from "#lib/components/settings/ConfigPage.svelte";
  import LayoutPage from "#lib/components/settings/LayoutPage.svelte";
  import BehaviorPage from "#lib/components/settings/BehaviorPage.svelte";
  import SectionsPage from "#lib/components/settings/SectionsPage.svelte";
  import TitleBar from "#lib/components/settings/TitleBar.svelte";
  import FileJson from "@lucide/svelte/icons/file-json";
  import LayoutGrid from "@lucide/svelte/icons/layout-grid";
  import Palette from "@lucide/svelte/icons/palette";
  import PanelTop from "@lucide/svelte/icons/panel-top";
  import SlidersHorizontal from "@lucide/svelte/icons/sliders-horizontal";

  const pages = [
    {
      label: "Appearance",
      icon: Palette,
      page: AppearancePage,
      tone: "--accent"
    },
    {
      label: "Sections",
      icon: LayoutGrid,
      page: SectionsPage,
      tone: "--ws-2"
    },
    { label: "Layout", icon: PanelTop, page: LayoutPage, tone: "--ws-3" },
    {
      label: "Behavior",
      icon: SlidersHorizontal,
      page: BehaviorPage,
      tone: "--ws-4"
    },
    { label: "Config", icon: FileJson, page: ConfigPage, tone: "--ws-5" }
  ];

  let current = $state.raw(pages[0]);
</script>

<div
  class="flex h-full flex-col overflow-hidden rounded-base bg-zb-base font-zb text-zb-size font-base text-zb-text"
  style:--tone="var({current?.tone})"
>
  <TitleBar>
    {#each pages as item (item.label)}
      {@const Icon = item.icon}
      <button
        class={["page-button", item === current && "on"]}
        style:--tone="var({item.tone})"
        aria-label={item.label}
        aria-current={item === current ? "page" : undefined}
        onclick={() => (current = item)}
      >
        <Icon />
        <span class="name">{item.label}</span>
      </button>
    {/each}
  </TitleBar>
  {#if current}
    {@const Page = current.page}
    <!-- Each page gets a scroller of its own, so that it starts from the top. -->
    {#key current}
      <main class="min-w-0 flex-1 overflow-y-auto px-4 pt-3">
        <div class="page mx-auto max-w-160">
          <Page />
        </div>
      </main>
    {/key}
  {/if}
</div>

<style>
  .page-button {
    position: relative;
    display: flex;
    height: 2.5rem;
    align-items: center;
    padding-inline: 0.7rem;
    border-radius: 999px;
    color: hsl(var(--tone));
    font-size: 1.2rem;
    transition:
      color var(--transition-duration) var(--spring-out),
      background-color var(--transition-duration) var(--spring-out),
      scale var(--time-soft) var(--spring-soft);
  }

  .page-button:active {
    scale: 0.94;
  }

  .page-button.on {
    background: hsl(var(--tone));
    color: hsl(var(--bg));
  }

  .name {
    max-width: 0;
    overflow: hidden;
    font-size: 0.93rem;
    font-weight: 600;
    opacity: 0;
    white-space: nowrap;
    transition:
      max-width var(--time-soft) var(--spring-soft),
      margin var(--time-soft) var(--spring-soft),
      opacity var(--transition-duration) var(--spring-out);
  }

  .on .name {
    max-width: 6rem;
    margin-left: 0.5rem;
    opacity: 1;
  }

  .page {
    animation: arrive var(--time-soft) var(--spring-soft);
  }

  @keyframes arrive {
    from {
      opacity: 0;
      translate: 0 0.7rem;
    }
  }
</style>
