<script lang="ts">
  import { closeFlyout } from "#lib/state/flyouts.svelte.ts";
  import {
    cancelPower,
    pendingPower,
    schedulePower
  } from "#lib/state/power.svelte.ts";
  import { secondsToHms } from "#lib/utils/format.ts";
  import Lock from "@lucide/svelte/icons/lock";
  import LogOut from "@lucide/svelte/icons/log-out";
  import Moon from "@lucide/svelte/icons/moon";
  import Power from "@lucide/svelte/icons/power";
  import RotateCw from "@lucide/svelte/icons/rotate-cw";
  import { onDestroy } from "svelte";
  import { shellExec } from "zebar";
  import Button from "../Button.svelte";

  /** How long an action waits to be confirmed, in milliseconds. */
  const CONFIRM_TIME = 3000;

  const SLEEP_COMMAND =
    "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState('Suspend', $false, $false)";

  const actions = [
    {
      id: "lock",
      label: "Lock",
      icon: Lock,
      tone: "--ws-1",
      run: () => shellExec("rundll32", ["user32.dll,LockWorkStation"])
    },
    {
      id: "sleep",
      label: "Sleep",
      icon: Moon,
      tone: "--ws-2",
      run: () =>
        shellExec("powershell", ["-NoProfile", "-Command", SLEEP_COMMAND])
    },
    {
      id: "sign-out",
      label: "Sign out",
      icon: LogOut,
      tone: "--ws-3",
      run: () => shellExec("shutdown", ["/l"])
    },
    {
      id: "restart",
      label: "Restart",
      icon: RotateCw,
      tone: "--ws-4",
      run: () => schedulePower("restart")
    },
    {
      id: "shutdown",
      label: "Shut down",
      icon: Power,
      tone: "--icon",
      run: () => schedulePower("shutdown")
    }
  ];

  type Action = (typeof actions)[number];

  let armed = $state<string | null>(null);
  let now = $state(Date.now());
  let disarm: ReturnType<typeof setTimeout> | undefined;

  const clock = setInterval(() => {
    now = Date.now();
  }, 1000);

  let pending = $derived(
    pendingPower.value && pendingPower.value.at > now
      ? pendingPower.value
      : null
  );

  const choose = async (action: Action) => {
    clearTimeout(disarm);

    if (armed !== action.id) {
      armed = action.id;
      disarm = setTimeout(() => {
        armed = null;
      }, CONFIRM_TIME);
      return;
    }

    armed = null;
    try {
      await action.run();
      if (action.id !== "restart" && action.id !== "shutdown") closeFlyout();
    } catch (error) {
      console.error(`Error running ${action.id}:`, error);
    }
  };

  onDestroy(() => {
    clearInterval(clock);
    clearTimeout(disarm);
  });
</script>

{#if pending}
  <div
    class="flex flex-col items-center gap-2 rounded-well bg-zb-surface-1 p-3"
  >
    <p>
      {pending.action === "shutdown" ? "Shutting down" : "Restarting"} in
      <span class="tabular-nums">
        {secondsToHms((pending.at - now) / 1000)}
      </span>
    </p>
    <Button main label="Cancel" callback={() => void cancelPower()} />
  </div>
{/if}

{#each actions as action (action.id)}
  {@const Icon = action.icon}
  <button
    class={["action", armed === action.id && "armed"]}
    style:--tone="var({action.tone})"
    onclick={() => void choose(action)}
  >
    <span class="icon"><Icon /></span>
    {armed === action.id ? "Click again to confirm" : action.label}
  </button>
{/each}

<style>
  .action {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.75rem;
    padding: 0.35rem;
    border-radius: 999px;
    text-align: left;
    transition:
      background-color var(--transition-duration) var(--spring-out),
      color var(--transition-duration) var(--spring-out),
      scale var(--time-soft) var(--spring-soft);
  }

  .action:hover {
    background: var(--surface-1);
  }

  .action:active {
    scale: 0.97;
  }

  .action.armed {
    background: hsl(var(--tone));
    color: hsl(var(--bg));
    font-weight: 600;
  }

  .icon {
    display: grid;
    width: 2.2rem;
    height: 2.2rem;
    flex: none;
    place-items: center;
    border-radius: 50%;
    background: color-mix(in srgb, hsl(var(--tone)) 24%, hsl(var(--bg)));
    color: hsl(var(--tone));
    font-size: 1.1rem;
    transition: background-color var(--transition-duration) var(--spring-out);
  }

  .armed .icon {
    background: hsl(var(--bg));
  }
</style>
