<script lang="ts">
  import type { WorkspaceStyle } from "#lib/config_schema.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import WorkspacePreview from "./WorkspacePreview.svelte";
  import StylePicker from "./StylePicker.svelte";

  const options: { value: WorkspaceStyle; label: string; note: string }[] = [
    {
      value: "keys",
      label: "Keys",
      note: "Tinted buttons, with a ring around the current one."
    },
    {
      value: "track",
      label: "Track",
      note: "One groove, with a bead that stretches across it."
    },
    {
      value: "string",
      label: "String",
      note: "The smallest. Other workspaces shrink to dots."
    },
    {
      value: "solid",
      label: "Solid",
      note: "A tinted bead each, with the current one filled."
    }
  ];
</script>

<StylePicker
  path="workspaces.style"
  label="Workspace style"
  value={config.workspaces.style}
  {options}
>
  {#snippet preview(style: WorkspaceStyle, hovered: boolean)}
    <WorkspacePreview {style} moving={hovered} />
  {/snippet}
</StylePicker>
