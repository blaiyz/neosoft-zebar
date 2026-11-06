<script lang="ts">
  import { configStatus } from "#lib/state/config.svelte.ts";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";

  let summary = $derived(
    [
      "These settings were ignored, because they aren't valid:",
      ...configStatus.issues
    ].join("\n")
  );
</script>

{#if configStatus.issues.length > 0}
  <span
    class="flex size-8 cursor-help items-center justify-center text-xl text-zb-icon"
    title={summary}
  >
    <TriangleAlert aria-label={summary} />
  </span>
{/if}
