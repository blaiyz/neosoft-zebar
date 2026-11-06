<script lang="ts">
  import { fieldsOf } from "#lib/config_form.ts";
  import { themePresets } from "#lib/config_schema.ts";
  import { config, updateSetting } from "#lib/state/config.svelte.ts";
  import { themeColors } from "#lib/theme.ts";
  import { onDestroy } from "svelte";
  import ColorField from "./ColorField.svelte";
  import Description from "./Description.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";

  /** How long typing has to stop for before the CSS applies, in milliseconds. */
  const CSS_DELAY = 400;
  const COLOR_COLUMNS = 3;

  let cssTimer: ReturnType<typeof setTimeout> | undefined;

  const onCssInput = (css: string) => {
    clearTimeout(cssTimer);
    cssTimer = setTimeout(() => {
      updateSetting("theme.customCss", css);
    }, CSS_DELAY);
  };

  const label = (preset: string) => preset.replaceAll("-", " ");

  /** Custom CSS isn't in a layer, so a color it sets beats every preset. */
  let fixedColors = $derived(
    themeColors.filter((name) =>
      new RegExp(`--${name}\\s*:`).test(config.theme.customCss)
    )
  );

  onDestroy(() => {
    clearTimeout(cssTimer);
  });
</script>

<SettingsGroup title="Theme">
  <div class="tiles grid grid-cols-3 gap-2">
    {#each themePresets as preset (preset)}
      <button
        class={["tile", config.theme.preset === preset && "on"]}
        data-theme={preset}
        aria-pressed={config.theme.preset === preset}
        onclick={() => updateSetting("theme.preset", preset)}
      >
        <span class="name capitalize">{label(preset)}</span>
        <span class="mini">
          <span class="size-2.5 rounded-full bg-zb-accent"></span>
          <span class="size-2.5 rounded-full bg-zb-icon"></span>
          <span class="size-2.5 rounded-full bg-zb-cpu"></span>
          <span class="size-2.5 rounded-full bg-zb-memory"></span>
          <span class="size-2.5 rounded-full bg-zb-ws-1"></span>
          <span class="size-2.5 rounded-full bg-zb-ws-2"></span>
        </span>
      </button>
    {/each}
  </div>
  {#if fixedColors.length > 0}
    <Description
      text="The custom CSS below sets {fixedColors.length} of the theme's colors, so they stay the same whichever theme is picked."
    />
  {/if}
</SettingsGroup>

<SettingsGroup
  title="Text and shape"
  fields={fieldsOf("theme", { skip: ["preset", "customCss"] })}
/>

<SettingsGroup title="Colors">
  <div
    class="grid grid-flow-col grid-cols-3 gap-x-4 gap-y-2"
    style:grid-template-rows="repeat({Math.ceil(
      themeColors.length / COLOR_COLUMNS
    )}, auto)"
  >
    {#each themeColors as name (name)}
      <ColorField {name} />
    {/each}
  </div>
</SettingsGroup>

<SettingsGroup title="Custom CSS">
  <Description
    text="Added after the theme, so it can override anything. It's the same value that a `custom.css` file sets."
  />
  <textarea
    class="mt-2 code-editor h-40"
    aria-label="Custom CSS"
    spellcheck="false"
    value={config.theme.customCss}
    oninput={(event) => {
      onCssInput(event.currentTarget.value);
    }}></textarea>
</SettingsGroup>

<style>
  /* Each is drawn in its own theme: a small bar over a backdrop of its colors. */
  .tile {
    position: relative;
    display: flex;
    height: 5.3rem;
    align-items: flex-end;
    overflow: hidden;
    padding-inline: 0.7rem;
    border-radius: var(--control-radius);
    background: linear-gradient(
      120deg,
      color-mix(in srgb, hsl(var(--volume-start)) 45%, hsl(var(--bg))),
      color-mix(in srgb, hsl(var(--volume-end)) 45%, hsl(var(--bg)))
    );
    color: hsl(var(--text));
    text-align: left;
    transition:
      translate var(--time-soft) var(--spring-soft),
      scale var(--time-soft) var(--spring-soft),
      box-shadow var(--transition-duration) var(--spring-out);
  }

  .tile:hover {
    translate: 0 -0.15rem;
  }

  .tile:active {
    scale: 0.97;
  }

  .tile.on {
    box-shadow: 0 0 0 0.15rem hsl(var(--accent));
  }

  .name {
    position: absolute;
    top: 0.6rem;
    left: 0.8rem;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .mini {
    display: flex;
    width: 100%;
    height: 2.1rem;
    align-items: center;
    justify-content: space-between;
    padding-inline: 0.7rem;
    border-radius: 0.85rem 0.85rem 0 0;
    background: hsl(var(--bg));
  }
</style>
