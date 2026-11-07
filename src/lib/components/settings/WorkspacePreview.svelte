<script lang="ts">
  import type { WorkspaceStyle } from "#lib/config_schema.ts";
  import WorkspaceRow from "../WorkspaceRow.svelte";

  type Props = { style: WorkspaceStyle; moving: boolean };

  let { style, moving }: Props = $props();

  const COUNT = 5;
  /** How long it stays on each workspace, in milliseconds. */
  const STEP_TIME = 900;

  let current = $state(2);

  let items = $derived(
    Array.from({ length: COUNT }, (_, index) => ({
      id: String(index),
      label: String(index + 1),
      color: index + 1,
      current: index === current
    }))
  );

  $effect(() => {
    if (!moving) return;

    const timer = setInterval(() => {
      current = (current + 1) % COUNT;
    }, STEP_TIME);

    return () => {
      clearInterval(timer);
    };
  });
</script>

<WorkspaceRow {items} {style} thin />
