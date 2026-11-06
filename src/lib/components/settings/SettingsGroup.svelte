<script lang="ts">
  import type { Field } from "#lib/config_form.ts";
  import type { Snippet } from "svelte";
  import SettingField from "./SettingField.svelte";

  type Props = {
    title: string;
    fields?: Field[];
    children?: Snippet;
  };

  let { title, fields = [], children }: Props = $props();
</script>

<section class="mb-5">
  <h2 class="mb-1.5 px-3 text-sm font-semibold text-[hsl(var(--tone))]">
    {title}
  </h2>
  <div class="flex flex-col rounded-well bg-zb-surface-1 p-1.5">
    {#each fields as field (field.path)}
      <SettingField {field} />
    {/each}
    {#if children}
      <div class="p-2.5 empty:hidden">
        {@render children()}
      </div>
    {/if}
  </div>
</section>
