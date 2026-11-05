<script lang="ts">
  import IconPowerButton from "@tabler/icons-svelte/icons/power";
  import { shellExec } from "zebar";
  import Button from "./Button.svelte";

  let shuttingDown = $state(false);

  async function togglePowerOff() {
    try {
      if (shuttingDown) {
        await shellExec("shutdown", ["/a"]);
        shuttingDown = false;
      } else {
        await shellExec("shutdown", ["/s"]);
        shuttingDown = true;
      }
    } catch (err) {
      console.error("Shutdown command failed", err);
      shuttingDown = false;
    }
  }
</script>

<Button class="text-zb-icon">
  <IconPowerButton
    onclick={() => {
      void togglePowerOff();
    }}
  />
</Button>
