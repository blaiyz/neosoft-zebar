<script lang="ts">
  import { RemoteState } from "#lib/remote_state.svelte.ts";
  import { onDestroy, onMount } from "svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import Button from "../../components/Button.svelte";

  let counter = RemoteState("counter", 0, onMount, onDestroy);
  let enabled = RemoteState("enabled", true, onMount, onDestroy);
  let shown = RemoteState("shown", true, onMount, onDestroy);

  $effect(() => {
    const window = getCurrentWindow();
    console.log(enabled.value);
    void window.setEnabled(enabled.value);
  });

  $effect(() => {
    const window = getCurrentWindow();
    if (shown.value) {
      void window.show();
    } else {
      void window.hide();
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
