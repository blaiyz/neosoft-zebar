<script lang="ts">
  import { config, updateConfig } from "#lib/state/config.svelte.ts";
  import { remToPx } from "#lib/state/layout.svelte.ts";
  import { providers } from "#lib/state/providers.svelte.ts";
  import { arrangeTray } from "#lib/utils/tray.ts";
  import type { SystrayIcon } from "zebar";
  import AnimatedList from "../AnimatedList.svelte";
  import TrayIconButton from "../TrayIconButton.svelte";
  import Well from "./Well.svelte";

  const COLUMNS = 6;
  /** The size of each icon's cell in rem, matching `size-10` below. */
  const CELL = 2.5;
  /** How far the pointer moves before a press counts as a drag, in pixels. */
  const DRAG_THRESHOLD = 4;

  type Zone = "pinned" | "others";
  type Entry = { key: string; icon: SystrayIcon };
  type Drag = {
    key: string;
    startX: number;
    startY: number;
    x: number;
    y: number;
    moved: boolean;
  };

  let systray = $derived(providers.systray);
  let entries = $derived(arrangeTray(systray?.icons ?? [], config.tray.order));

  const isPinned = ({ key }: Entry) => config.tray.pinned.includes(key);

  // These hold where things are during a drag, and go back to the saved settings
  // once those change.
  let pinned = $derived(
    arrangeTray(systray?.icons ?? [], config.tray.pinned)
      .filter(isPinned)
      .map(({ key }) => key)
  );
  let others = $derived(
    entries.filter((entry) => !isPinned(entry)).map(({ key }) => key)
  );

  let drag = $state.raw<Drag | null>(null);
  let dragged = false;

  let pinnedZone = $state<HTMLElement>();
  let othersZone = $state<HTMLElement>();

  const entryOf = (key: string) => entries.find((entry) => entry.key === key);
  const toEntries = (keys: string[]) =>
    keys.flatMap((key) => entryOf(key) ?? []);

  /** The zone under the pointer, or the closer one when it's outside both. */
  function zoneAt(y: number): Zone {
    const top = othersZone?.getBoundingClientRect().top ?? 0;
    return y < top ? "pinned" : "others";
  }

  function indexAt(zone: HTMLElement, x: number, y: number, count: number) {
    const cell = remToPx(CELL);
    const { left, top } = zone.getBoundingClientRect();
    const column = Math.floor((x - left) / cell);
    const row = Math.max(0, Math.floor((y - top) / cell));
    const index = row * COLUMNS + Math.max(0, Math.min(COLUMNS - 1, column));
    return Math.min(index, count);
  }

  function moveTo(key: string, x: number, y: number) {
    const zone = zoneAt(y);
    const element = zone === "pinned" ? pinnedZone : othersZone;
    if (!element) return;

    const nextPinned = pinned.filter((other) => other !== key);
    const nextOthers = others.filter((other) => other !== key);
    const target = zone === "pinned" ? nextPinned : nextOthers;
    target.splice(indexAt(element, x, y, target.length), 0, key);

    pinned = nextPinned;
    others = nextOthers;
  }

  /** Keeps what's saved for icons that aren't in the tray right now. */
  function save() {
    const present = [...pinned, ...others];
    const absent = (keys: string[]) =>
      keys.filter((key) => !present.includes(key));

    updateConfig({
      tray: {
        pinned: [...pinned, ...absent(config.tray.pinned)],
        order: [...present, ...absent(config.tray.order)]
      }
    });
  }

  const onPointerDown = (event: PointerEvent, key: string) => {
    if (event.button !== 0) return;
    dragged = false;
    drag = {
      key,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false
    };
  };

  const onPointerMove = ({ clientX: x, clientY: y }: PointerEvent) => {
    if (!drag) return;

    const distance = Math.hypot(x - drag.startX, y - drag.startY);
    const moved = drag.moved || distance >= DRAG_THRESHOLD;
    drag = { ...drag, x, y, moved };
    if (moved) moveTo(drag.key, x, y);
  };

  const onPointerUp = () => {
    if (drag?.moved) {
      dragged = true;
      save();
    }
    drag = null;
  };
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={onPointerUp} />

{#snippet trayIcon({ key, icon }: Entry)}
  <TrayIconButton
    {icon}
    class={[
      "size-10 touch-none rounded-control hover:bg-zb-surface-2",
      drag?.moved && drag.key === key && "opacity-0"
    ]}
    ignoreClick={() => dragged}
    onpointerdown={(event: PointerEvent) => {
      onPointerDown(event, key);
    }}
  />
{/snippet}

<Well title="Pinned to the bar" tone="--accent">
  <div class="min-h-10" bind:this={pinnedZone}>
    {#if pinned.length === 0}
      <p class="py-2 text-sm text-zb-dim">Drag icons here</p>
    {/if}
    <AnimatedList
      items={toEntries(pinned)}
      key={({ key }: Entry) => key}
      item={trayIcon}
      columns={COLUMNS}
    />
  </div>
</Well>

<Well title="In the tray" tone="--memory">
  <div class="min-h-10" bind:this={othersZone}>
    <AnimatedList
      items={toEntries(others)}
      key={({ key }: Entry) => key}
      item={trayIcon}
      columns={COLUMNS}
    />
  </div>
</Well>

{#if drag?.moved}
  {@const icon = entryOf(drag.key)?.icon}
  {#if icon}
    <img
      class="pointer-events-none fixed size-5 -translate-x-1/2 -translate-y-1/2"
      style:left="{drag.x}px"
      style:top="{drag.y}px"
      src={icon.iconUrl}
      alt=""
    />
  {/if}
{/if}
