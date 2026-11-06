<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = { label: string; children: Snippet };

  let { label, children }: Props = $props();
</script>

<div class="flex items-baseline justify-between gap-4">
  <span class="min-w-0 truncate text-zb-dim" title={label}>{label}</span>
  <span class="max-w-2/3 flex-none text-right break-words tabular-nums">
    {@render children()}
  </span>
</div>
