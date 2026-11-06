<script lang="ts">
  import { config } from "#lib/state/config.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import type { ClassValue } from "svelte/elements";
  import type { SystrayIcon } from "zebar";

  type Props = {
    icon: SystrayIcon;
    class?: ClassValue;
    onpointerdown?: (event: PointerEvent) => void;
    /** Whether the last press was something other than a click, like a drag. */
    ignoreClick?: () => boolean;
  };

  let { icon, class: className, onpointerdown, ignoreClick }: Props = $props();

  let systray = $derived(providers.systray);
</script>

<button
  class={["flex items-center justify-center", className]}
  title={icon.tooltip}
  aria-label={icon.tooltip}
  {onpointerdown}
  onclick={() => {
    if (!ignoreClick?.()) void systray?.onLeftClick(icon.id);
  }}
  ondblclick={() => void systray?.onLeftDoubleClick(icon.id)}
  oncontextmenu={(event) => {
    event.preventDefault();
    void systray?.onRightClick(icon.id);
  }}
  onauxclick={(event) => {
    if (event.button === 1) void systray?.onMiddleClick(icon.id);
  }}
  onpointerenter={() => void systray?.onHoverEnter(icon.id)}
  onpointermove={() => void systray?.onHoverMove(icon.id)}
  onpointerleave={() => void systray?.onHoverLeave(icon.id)}
>
  <img
    class={["size-5", config.tray.invertIcons && "invert"]}
    src={icon.iconUrl}
    alt=""
    draggable="false"
  />
</button>
