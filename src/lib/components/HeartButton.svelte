<script lang="ts">
  import IconHeartFilled from "@tabler/icons-svelte/icons/heart-filled";
  import { shellExec } from "zebar";
  import Button from "./Button.svelte";
</script>

<Button class="text-zb-icon">
  <IconHeartFilled
    onclick={() => {
      void shellExec("cmd", [
        "/c",
        "start",
        "https://github.com/blaiyz/neosoft-zebar"
      ]);
    }}
  />
</Button>
