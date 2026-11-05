<script lang="ts">
  import Button from "#lib/components/Button.svelte";
  import { RemoteState } from "#lib/state/remote_state.svelte.ts";
  import { getCurrentWindow } from "@tauri-apps/api/window";

  let counter = RemoteState("counter", 0);
  let enabled = RemoteState("enabled", true);
  let shown = RemoteState("shown", true);

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
  class="h-screen w-screen border-8 border-red-600 bg-zb-base font-zb text-lg text-zb-text"
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
