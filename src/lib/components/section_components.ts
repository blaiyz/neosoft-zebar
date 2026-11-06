import type { SectionId } from "#lib/sections.ts";
import type { Component } from "svelte";
import BatteryMeter from "./BatteryMeter.svelte";
import Clock from "./Clock.svelte";
import CpuMeter from "./CpuMeter.svelte";
import HeartButton from "./HeartButton.svelte";
import MemoryMeter from "./MemoryMeter.svelte";
import NetworkStatus from "./NetworkStatus.svelte";
import NowPlaying from "./NowPlaying.svelte";
import PowerButton from "./PowerButton.svelte";
import SettingsButton from "./SettingsButton.svelte";
import TrayIcons from "./TrayIcons.svelte";
import VolumeControl from "./VolumeControl.svelte";
import Weather from "./Weather.svelte";

export const sectionComponents: Record<SectionId, Component> = {
  settings: SettingsButton,
  power: PowerButton,
  heart: HeartButton,
  cpu: CpuMeter,
  memory: MemoryMeter,
  battery: BatteryMeter,
  network: NetworkStatus,
  media: NowPlaying,
  tray: TrayIcons,
  volume: VolumeControl,
  weather: Weather,
  clock: Clock
};
