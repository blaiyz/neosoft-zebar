<script lang="ts" generics="T">
  type Props = {
    value: T;
    options: { value: T; label: string }[];
    label: string;
    onchange: (value: T) => void;
  };

  let { value, options, label, onchange }: Props = $props();

  let index = $derived(options.findIndex((option) => option.value === value));
</script>

<!-- Every option is as wide as the widest in bold, which lets the thumb slide in whole
     steps and keeps the width the same whichever one is selected. -->
<div
  class="choice"
  style:--count={options.length}
  style:--index={index}
  role="radiogroup"
  aria-label={label}
>
  {#if index >= 0}<span class="thumb"></span>{/if}
  {#each options as option (option.label)}
    <button
      class={["option", option.value === value && "on"]}
      data-label={option.label}
      role="radio"
      aria-checked={option.value === value}
      onclick={() => {
        onchange(option.value);
      }}
    >
      {option.label}
    </button>
  {/each}
</div>

<style>
  .choice {
    position: relative;
    display: grid;
    flex: none;
    grid-template-columns: repeat(var(--count), minmax(0, 1fr));
    padding: 0.2rem;
    border-radius: var(--control-radius);
    background: var(--surface-2);
    transition: background-color var(--transition-duration) var(--spring-out);
  }

  .choice:hover {
    background: var(--surface-3);
  }

  .thumb {
    position: absolute;
    top: 0.2rem;
    bottom: 0.2rem;
    left: 0.2rem;
    width: calc((100% - 0.4rem) / var(--count));
    border-radius: calc(var(--control-radius) - 0.2rem);
    background: hsl(var(--tone, var(--accent)));
    translate: calc(var(--index) * 100%) 0;
    transition: translate var(--time-soft) var(--spring-soft);
  }

  .option {
    position: relative;
    height: 2rem;
    padding-inline: 0.7rem;
    color: var(--dim);
    font-size: 0.93rem;
    transition: color var(--transition-duration) var(--spring-out);
  }

  .option.on {
    color: hsl(var(--bg));
    font-weight: 600;
  }

  .option::after {
    display: block;
    height: 0;
    content: attr(data-label);
    font-weight: 600;
    visibility: hidden;
  }
</style>
