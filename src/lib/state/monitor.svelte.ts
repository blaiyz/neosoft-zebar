import {
  currentMonitor,
  primaryMonitor,
  type Monitor
} from "@tauri-apps/api/window";
import { currentWidget } from "zebar";

let onPrimaryMonitor = $state(false);

function isSameMonitor(a: Monitor, b: Monitor) {
  return (
    a.name === b.name &&
    a.position.x === b.position.x &&
    a.position.y === b.position.y &&
    a.size.width === b.size.width &&
    a.size.height === b.size.height
  );
}

async function updateMonitor() {
  try {
    const [current, primary] = await Promise.all([
      currentMonitor(),
      primaryMonitor()
    ]);
    onPrimaryMonitor =
      current !== null && primary !== null && isSameMonitor(current, primary);
  } catch (error) {
    console.error("Error reading monitors:", error);
  }
}

/** Monitors can change while the bar runs, so this rechecks when the window does. */
export function initMonitor() {
  const window = currentWidget().tauriWindow;
  const recheck = () => {
    void updateMonitor();
  };

  recheck();
  void window.onMoved(recheck);
  void window.onResized(recheck);
}

export function isOnPrimaryMonitor(): boolean {
  return onPrimaryMonitor;
}
