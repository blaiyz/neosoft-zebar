<script lang="ts">
  import { fieldsOf, toLabel, type Field } from "#lib/config_form.ts";
  import type { BarPart, SectionId } from "#lib/sections.ts";
  import { config, updateSetting } from "#lib/state/config.svelte.ts";
  import Toggle from "../Toggle.svelte";
  import BarMap from "./BarMap.svelte";
  import Description from "./Description.svelte";
  import MediaStylePicker from "./MediaStylePicker.svelte";
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
    tray: fieldsOf("tray"),
    volume: fieldsOf("volume"),
    weather: fieldsOf("weather"),
    workspaces: fieldsOf("workspaces", { skip: ["style"] })
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
  let section = $derived(selected === "workspaces" ? null : selected);
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
    <SettingsGroup title={toLabel(selected)} {fields}>
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
