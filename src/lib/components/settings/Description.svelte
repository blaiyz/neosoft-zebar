<script lang="ts">
  let { text }: { text: string } = $props();

  // Descriptions are written for editors, which show them as Markdown.
  let parts = $derived(text.split("`"));
</script>

<p class="mt-0.5 text-sm font-normal whitespace-pre-line text-zb-dim">
  {#each parts as part, index (index)}
    {#if index % 2 === 1}
      <code class="rounded bg-zb-surface-2 px-1 font-mono text-[0.9em]"
        >{part}</code
      >
    {:else}
      {part}
    {/if}
  {/each}
</p>
