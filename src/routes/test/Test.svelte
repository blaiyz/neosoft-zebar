<script lang="ts">
  import Button from "#lib/components/Button.svelte";
  import { RemoteState } from "#lib/state/remote_state.svelte.ts";
  import { startWidget } from "zebar";

  let counter = RemoteState("counter", 0);
  let enabled = RemoteState("enabled", true);
  let shown = RemoteState("shown", true);
</script>

<Button
  class="rounded-full bg-zb-muted"
  callback={() => {
    void startWidget("test", {
      anchor: "bottom_left",
      offsetX: "250px",
      offsetY: "-50px",
      width: "400px",
      height: "300px",
      dockToEdge: {
        edge: "top",
        enabled: false,
        windowMargin: "40px"
      },
      monitorSelection: { type: "primary" }
    });
  }}
>
  Create Widget
</Button>
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
    enabled.value = !enabled.value;
  }}
>
  {enabled.value ? "Enabled" : "Disabled"}
</Button>
<Button
  callback={() => {
    shown.value = !shown.value;
  }}
>
  {shown.value ? "Shown" : "Hidden"}
</Button>
