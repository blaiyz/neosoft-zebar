import { RemoteState } from "#lib/state/remote_state.svelte.ts";
import { shellExec } from "zebar";

/** How long Windows waits before shutting down, in seconds, so it can be cancelled. */
export const POWER_DELAY = 60;

export type PendingPower = {
  action: "shutdown" | "restart";
  /** When it happens, in milliseconds since the epoch. */
  at: number;
};

/** Shared, because any bar can show it and the flyout that cancels it comes and goes. */
export const pendingPower = new RemoteState<PendingPower | null>("power", null);

export async function schedulePower(action: PendingPower["action"]) {
  const flag = action === "shutdown" ? "/s" : "/r";
  await shellExec("shutdown", [flag, "/t", String(POWER_DELAY)]);
  pendingPower.value = { action, at: Date.now() + POWER_DELAY * 1000 };
}

export async function cancelPower() {
  await shellExec("shutdown", ["/a"]);
  pendingPower.value = null;
}
