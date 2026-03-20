import { providers } from "$lib/providers.svelte";

let glazewm = $derived(providers.glazewm);

export function initializePositioner() {
  $effect(() => {});
}
