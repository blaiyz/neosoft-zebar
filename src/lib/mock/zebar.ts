/**
 * Browser stand-in for the `zebar` package, used by `pnpm dev:mock`.
 *
 * `vite.config.ts` aliases `zebar` to this file in the `mock` mode, so the bar
 * renders in a normal browser with fixed data and hot reload. Nothing here runs
 * in a real build. It covers only what the bar uses, and the controls change
 * this fake state rather than the system. Tauri's own calls are answered here too,
 * so the bar believes it is on the primary monitor.
 */
import zpack from "#static/zpack.json";
import { mockIPC } from "@tauri-apps/api/mocks";
import { ContainerType } from "glazewm";

const MONITOR = {
  name: "Mock monitor",
  scaleFactor: 1,
  position: { x: 0, y: 0 },
  size: { width: 1920, height: 1080 }
};

const WORKSPACE_NAMES = ["1", "2", "3"];
const windows = ["firefox", "code", "windowsterminal"].map(
  (processName, index) => ({
    type: ContainerType.WINDOW,
    id: `window-${processName}`,
    title: processName,
    processName,
    hasFocus: index === 0,
    width: 1920,
    height: 1080
  })
);

const state = {
  displayedWorkspace: "1",
  tilingDirection: "horizontal",
  isPlaying: true,
  volume: 60,
  isMuted: false
};

function buildOutputMap() {
  const workspaces = WORKSPACE_NAMES.map((name) => {
    const isDisplayed = name === state.displayedWorkspace;
    return {
      type: ContainerType.WORKSPACE,
      id: `workspace-${name}`,
      name,
      isDisplayed,
      hasFocus: isDisplayed,
      children: isDisplayed ? windows : []
    };
  });
  const monitor = {
    id: "monitor",
    x: 0,
    y: 0,
    hasFocus: true,
    children: workspaces
  };

  return {
    battery: { state: "discharging", chargePercent: 72 },
    cpu: { usage: 24 },
    date: { new: new Date() },
    glazewm: {
      displayedWorkspace: workspaces.find((ws) => ws.isDisplayed),
      focusedWorkspace: workspaces.find((ws) => ws.hasFocus),
      currentWorkspaces: workspaces,
      allWorkspaces: workspaces,
      focusedMonitor: monitor,
      currentMonitor: monitor,
      allMonitors: [monitor],
      allWindows: windows,
      focusedContainer: windows[0],
      tilingDirection: state.tilingDirection,
      bindingModes: [],
      runCommand
    },
    memory: { usage: 58 },
    network: {
      defaultInterface: { type: "wifi" },
      defaultGateway: { signalStrength: 80, ssid: "Mock Wi-Fi" },
      traffic: {
        received: { iecValue: 2.929, iecUnit: "KiB" },
        transmitted: { iecValue: 512, iecUnit: "B" }
      }
    },
    weather: { status: "cloudy_day", celsiusTemp: 22, fahrenheitTemp: 72 },
    media: {
      currentSession: {
        title: "Mock Song",
        position: 72,
        endTime: 210,
        isPlaying: state.isPlaying
      },
      previous: () => console.log("[mock] previous track"),
      next: () => console.log("[mock] next track"),
      togglePlayPause: () => update({ isPlaying: !state.isPlaying })
    },
    audio: {
      defaultPlaybackDevice: { volume: state.volume, isMuted: state.isMuted },
      setVolume: (volume: number) => update({ volume }),
      setMute: (isMuted: boolean) => update({ isMuted })
    }
  };
}

type OutputMap = ReturnType<typeof buildOutputMap>;
const outputListeners: ((outputMap: OutputMap) => void)[] = [];

function update(changes: Partial<typeof state>) {
  Object.assign(state, changes);
  const outputMap = buildOutputMap();
  outputListeners.forEach((listener) => listener(outputMap));
}

function runCommand(command: string) {
  const workspace = command.match(/^focus --workspace (.+)$/)?.[1];
  if (workspace) {
    update({ displayedWorkspace: workspace });
  } else if (command === "toggle-tiling-direction") {
    const isHorizontal = state.tilingDirection === "horizontal";
    update({ tilingDirection: isHorizontal ? "vertical" : "horizontal" });
  } else {
    console.log("[mock] GlazeWM command:", command);
  }
  return Promise.resolve();
}

export function createProviderGroup() {
  return {
    onOutput(listener: (outputMap: OutputMap) => void) {
      outputListeners.push(listener);
      listener(buildOutputMap());
    },
    onError() {}
  };
}

export function currentWidget() {
  return {
    tauriWindow: {
      setEffects: async () => {},
      clearEffects: async () => {},
      setIgnoreCursorEvents: async () => {},
      onMoved: async () => {},
      onResized: async () => {}
    }
  };
}

export function shellExec(program: string, args: string[]) {
  console.log("[mock] shell command:", program, ...args);
  return Promise.resolve();
}

// In Zebar the page fills a window with the preset's height, over the desktop.
if (typeof document !== "undefined") {
  mockIPC(<T>(command: string) =>
    Promise.resolve((command.endsWith("_monitor") ? MONITOR : null) as T)
  );
  document.body.style.height = zpack.widgets[0]?.presets[0]?.height ?? "100%";
  document.documentElement.style.background = "#1e4f8a";
}
