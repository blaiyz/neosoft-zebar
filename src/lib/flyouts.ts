import type { ProviderName } from "#lib/state/providers.svelte.ts";
import type { Component } from "svelte";

type FlyoutView = {
  /** The size of its window in rem, which it may not fill. */
  width: number;
  height: number;
  /** What it reads, which the flyout window keeps running. */
  providers: ProviderName[];
  load: () => Promise<{ default: Component }>;
};

/** Each is its own chunk, which the flyout window loads ahead of being opened. */
export const flyoutViews = {
  audio: {
    width: 24,
    height: 30,
    providers: ["audio"],
    load: () => import("#lib/components/flyouts/Audio.svelte")
  },
  calendar: {
    width: 21,
    height: 26,
    providers: [],
    load: () => import("#lib/components/flyouts/Calendar.svelte")
  },
  network: {
    width: 25,
    height: 35,
    providers: ["network"],
    load: () => import("#lib/components/flyouts/Network.svelte")
  },
  power: {
    width: 17,
    height: 21,
    providers: [],
    load: () => import("#lib/components/flyouts/Power.svelte")
  },
  system: {
    width: 27,
    height: 52,
    providers: ["battery", "cpu", "disk", "host", "memory"],
    load: () => import("#lib/components/flyouts/System.svelte")
  },
  tray: {
    width: 20,
    height: 22,
    providers: ["systray"],
    load: () => import("#lib/components/flyouts/Tray.svelte")
  }
} satisfies Record<string, FlyoutView>;

export type FlyoutId = keyof typeof flyoutViews;

export const flyoutProviders: readonly ProviderName[] = [
  ...new Set(
    Object.values<FlyoutView>(flyoutViews).flatMap(({ providers }) => providers)
  )
];
