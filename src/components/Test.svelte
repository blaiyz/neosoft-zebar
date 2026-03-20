<script lang="ts">
  import { RemoteState } from "$lib/widgets/remote_state.svelte";
  import { onDestroy, onMount } from "svelte";
  import Button from "./Button.svelte";
  import { startWidget, startWidgetPreset } from "zebar";

  let counter = RemoteState("counter", 0, onMount, onDestroy);
  let shown = RemoteState("shown", false, onMount, onDestroy);

  onMount(async () => {
    startWidgetPreset("test", "default");
  });
</script>

<Button
  class="text-zb-icon"
  callback={() => {
    counter.value++;
  }}
>
  {counter.value}
</Button>
<Button
  callback={() => {
    shown.value = !shown.value;
  }}
>
  {shown.value ? "Shown" : "Hidden"}
</Button>
