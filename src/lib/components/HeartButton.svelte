<script lang="ts">
  import IconHeartFilled from "@tabler/icons-svelte/icons/heart-filled";
  import { shellExec } from "zebar";
  import BeadButton from "./BeadButton.svelte";
</script>

<BeadButton
  label="Open the project on GitHub"
  tone="--icon"
  onclick={() => {
    void shellExec("cmd", [
      "/c",
      "start",
      "https://github.com/blaiyz/neosoft-zebar"
    ]);
  }}
>
  <IconHeartFilled />
</BeadButton>
