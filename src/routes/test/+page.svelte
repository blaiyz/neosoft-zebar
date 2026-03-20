<script lang="ts">
  import { RemoteState } from "$lib/widgets/remote_state.svelte";
  import { onDestroy, onMount } from "svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import Button from "$comp/Button.svelte";
  import * as zebar from "zebar";

  let counter = RemoteState("counter", 0, onMount, onDestroy, true);
  let shown = RemoteState("shown", true, onMount, onDestroy, true);

  $effect(() => {
    const window = getCurrentWindow();
    if (shown.value) {
      window.show();
    } else {
      window.hide();
    }
  });

  let derivedTest = $derived(counter.value + 100);
</script>

<div
  class="bg-zb-base border-8 border-red-600 h-screen w-screen font-zb text-zb-text text-lg"
>
  Counter: {JSON.stringify(counter, null, 2)}
  Derived: {derivedTest}
  <Button
    callback={() => {
      counter.value = 0;
    }}
  >
    Reset Counter
  </Button>
</div>
