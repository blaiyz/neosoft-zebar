<script lang="ts">
  import type { MediaStyle } from "#lib/config_schema.ts";
  import { config } from "#lib/state/config.svelte.ts";
  import { onDestroy } from "svelte";
  import MediaControls from "../MediaControls.svelte";
  import StylePicker from "./StylePicker.svelte";

  /** The length of the sample track, in seconds. */
  const END_TIME = 241;

  const options: { value: MediaStyle; label: string; note: string }[] = [
    {
      value: "pill",
      label: "Pill",
      note: "The controls share a pill, with progress around play."
    },
    {
      value: "tucked",
      label: "Tucked",
      note: "The calmest. Back and next come out on hover."
    },
    {
      value: "capsule",
      label: "Capsule",
      note: "The whole section fills as the track plays."
    },
    {
      value: "equalizer",
      label: "Equalizer",
      note: "Dancing bars while it plays, which always move."
    }
  ];

  let position = $state(78);

  const timer = setInterval(() => {
    position = (position + 1) % END_TIME;
  }, 1000);

  onDestroy(() => {
    clearInterval(timer);
  });

  let session = $derived({
    title: "Midnight City",
    position,
    endTime: END_TIME,
    isPlaying: true
  });
</script>

<StylePicker
  path="media.style"
  label="Media style"
  value={config.media.style}
  {options}
>
  {#snippet preview(style: MediaStyle, hovered: boolean)}
    <MediaControls {style} {session} peek={hovered} />
  {/snippet}
</StylePicker>
