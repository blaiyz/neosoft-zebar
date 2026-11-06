<script lang="ts">
  import type { Field } from "#lib/config_form.ts";
  import { isDocument } from "#lib/config_document.ts";
  import { config, updateSetting } from "#lib/state/config.svelte.ts";
  import Toggle from "../Toggle.svelte";
  import Choice from "./Choice.svelte";
  import Description from "./Description.svelte";

  let { field }: { field: Field } = $props();

  let problem = $state<string | null>(null);

  const read = (path: string) => {
    let value: unknown = config;
    for (const key of path.split(".")) {
      value = isDocument(value) ? value[key] : undefined;
    }
    return value;
  };

  let value = $derived(read(field.path));

  const change = (next: unknown) => {
    const [issue] = updateSetting(field.path, next);
    problem = issue?.replace(`${field.path}: `, "") ?? null;
  };
</script>

<div
  class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-control px-2.5 py-2"
>
  <div class="min-w-60 flex-1">
    <div>{field.label}</div>
    {#if field.description}<Description text={field.description} />{/if}
    {#if problem}
      <p class="mt-0.5 text-sm text-zb-icon">{problem}</p>
    {/if}
  </div>

  {#if field.control.type === "toggle"}
    <Toggle label={field.label} checked={value === true} onchange={change} />
  {:else if field.control.type === "choice"}
    <Choice
      label={field.label}
      options={field.control.options}
      {value}
      onchange={change}
    />
  {:else if field.control.type === "number"}
    <input
      class="field-input"
      type="number"
      aria-label={field.label}
      min={field.control.minimum}
      value={value as number}
      onchange={(event) => {
        change(event.currentTarget.valueAsNumber);
      }}
    />
  {:else}
    {@const { nullable } = field.control}
    <input
      class="field-input"
      type="text"
      aria-label={field.label}
      spellcheck="false"
      value={(value as string | null) ?? ""}
      onchange={({ currentTarget: { value: text } }) => {
        change(nullable && text === "" ? null : text);
      }}
    />
  {/if}
</div>
