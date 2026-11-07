<script lang="ts">
  type Props = {
    checked: boolean;
    label: string;
    onchange: (checked: boolean) => void;
  };

  let { checked, label, onchange }: Props = $props();
</script>

<button
  class="toggle"
  class:on={checked}
  role="switch"
  aria-checked={checked}
  aria-label={label}
  onclick={() => {
    onchange(!checked);
  }}
></button>

<style>
  .toggle {
    --knob: 1.3rem;
    --knob-pressed: 1.7rem;
    --gap: 0.2rem;

    position: relative;
    flex: none;
    width: 2.85rem;
    height: 1.7rem;
    border-radius: 999px;
    background: var(--surface-3);
    transition: background-color var(--transition-duration) var(--spring-out);
  }

  .toggle::after {
    content: "";
    position: absolute;
    top: var(--gap);
    left: var(--gap);
    width: var(--knob);
    height: var(--knob);
    border-radius: 999px;
    background: hsl(var(--text));
    transition:
      left var(--time-soft) var(--spring-soft),
      width var(--transition-duration) var(--spring-out),
      background-color var(--transition-duration) var(--spring-out);
  }

  .toggle:active::after {
    width: var(--knob-pressed);
  }

  .toggle.on {
    background: hsl(var(--tone, var(--accent)));
  }

  .toggle.on::after {
    left: calc(100% - var(--knob) - var(--gap));
    background: hsl(var(--bg));
  }

  .toggle.on:active::after {
    left: calc(100% - var(--knob-pressed) - var(--gap));
  }
</style>
