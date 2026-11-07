<script lang="ts">
  import { fieldsOf, toLabel, type Field } from "#lib/config_form.ts";
  import type { BarPart, SectionId } from "#lib/sections.ts";
  import { config, updateSetting } from "#lib/state/config.svelte.ts";
  import { readPalette } from "#lib/theme_palette.ts";
  import Toggle from "../Toggle.svelte";
  import BarMap from "./BarMap.svelte";
  import Description from "./Description.svelte";
  import MediaStylePicker from "./MediaStylePicker.svelte";
  import PaletteField from "./PaletteField.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";
  import WorkspaceStylePicker from "./WorkspaceStylePicker.svelte";

  /** The parts of the bar with settings beyond whether they show. */
  const ownFields: Partial<Record<BarPart, Field[]>> = {
    battery: fieldsOf("battery"),
    clock: fieldsOf("clock"),
    cpu: fieldsOf("cpu"),
    disk: fieldsOf("disk"),
    keyboard: fieldsOf("keyboard"),
    media: fieldsOf("media", { skip: ["style"] }),
    memory: fieldsOf("memory"),
    network: fieldsOf("network"),
    taskbar: fieldsOf("taskbarIntegration"),
    tray: fieldsOf("tray"),
    volume: fieldsOf("volume"),
    weather: fieldsOf("weather"),
    workspaces: fieldsOf("workspaces", { skip: ["style"] })
  };

  /** The theme's colors that belong to each part, with what each is for. */
  const ownColors: Partial<Record<BarPart, [name: string, label: string][]>> = {
    workspaces: [
      ["ws-1", "Workspace 1"],
      ["ws-2", "Workspace 2"],
      ["ws-3", "Workspace 3"],
      ["ws-4", "Workspace 4"],
      ["ws-5", "Workspace 5"],
      ["tiling-direction", "Tiling direction"],
      ["paused", "Paused"]
    ],
    cpu: [
      ["cpu", "Usage"],
      ["cpu-high-usage", "High usage"]
    ],
    memory: [
      ["memory", "Usage"],
      ["memory-high-usage", "High usage"]
    ],
    disk: [
      ["disk", "Usage"],
      ["disk-high-usage", "High usage"]
    ],
    battery: [
      ["battery-good", "Charged"],
      ["battery-mid", "Half"],
      ["battery-low", "Low"]
    ],
    network: [["network", "Network"]],
    keyboard: [["keyboard", "Layout"]],
    volume: [
      ["volume-start", "Start"],
      ["volume-end", "End"],
      ["volume-inner", "Inside"]
    ],
    weather: [["weather", "Weather"]]
  };

  // Most sections share a description, which is only worth reading once.
  const sharedDescription = fieldsOf("sections", { only: ["power"] })[0]
    ?.description;

  const showField = (id: SectionId) =>
    fieldsOf("sections", { only: [id] }).map((field) => ({
      ...field,
      label: "Show on the bar",
      description:
        field.description === sharedDescription ? "" : field.description
    }));

  let selected = $state<BarPart>("workspaces");
  let section = $derived(
    selected === "workspaces" || selected === "taskbar" ? null : selected
  );
  let colors = $derived(ownColors[selected] ?? []);
  let palette = $derived(readPalette(config.theme.preset));
  let fields = $derived([
    ...(section ? showField(section) : []),
    ...(ownFields[selected] ?? [])
  ]);

  const setPrimaryOnly = (id: SectionId, primaryOnly: boolean) => {
    const others = config.bar.primaryMonitorOnly.filter((item) => item !== id);
    updateSetting(
      "bar.primaryMonitorOnly",
      primaryOnly ? [...others, id] : others
    );
  };
</script>

<div class="mb-5">
  <BarMap
    {selected}
    onpick={(part: BarPart) => {
      selected = part;
    }}
  />
  <div class="mt-2 px-3">
    <Description
      text="On always shows a section, Off removes it, and Auto shows it when there's room. The others give way to one that's on."
    />
  </div>
</div>

{#key selected}
  <div class="arrive">
    {#if selected === "workspaces" || selected === "media"}
      <SettingsGroup title="Style">
        {#if selected === "workspaces"}
          <WorkspaceStylePicker />
        {:else}
          <MediaStylePicker />
        {/if}
      </SettingsGroup>
    {/if}
    <SettingsGroup
      title={selected === "taskbar" ? "Taskbar integration" : toLabel(selected)}
      {fields}
    >
      {#if section}
        {@const id = section}
        <div class="flex items-center justify-between gap-2">
          <span>Only on the primary monitor</span>
          <Toggle
            label="Only show {id} on the primary monitor"
            checked={config.bar.primaryMonitorOnly.includes(id)}
            onchange={(checked: boolean) => {
              setPrimaryOnly(id, checked);
            }}
          />
        </div>
      {/if}
    </SettingsGroup>
    {#if colors.length > 0}
      <SettingsGroup title="Colors">
        <div class="flex flex-col gap-2">
          {#each colors as [name, label] (name)}
            <PaletteField {name} {label} {palette} />
          {/each}
        </div>
      </SettingsGroup>
    {/if}
  </div>
{/key}

<style>
  .arrive {
    animation: arrive var(--time-soft) var(--spring-soft);
  }

  @keyframes arrive {
    from {
      opacity: 0;
      translate: 0 0.5rem;
    }
  }
</style>
