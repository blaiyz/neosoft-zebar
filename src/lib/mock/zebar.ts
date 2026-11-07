/**
 * Browser stand-in for the `zebar` package, used by `pnpm dev:mock`.
 *
 * `vite.config.ts` aliases `zebar` to this file in the `mock` mode, so the bar
 * renders in a normal browser with fixed data and hot reload. Nothing here runs
 * in a real build. It covers only what the bar uses, and the controls change
 * this fake state rather than the system. Tauri's own calls are answered here too,
 * so the bar believes it is on the primary monitor. Widgets open as browser windows,
 * which share `localStorage` and `BroadcastChannel` with the bar like real ones do.
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
  devices: [
    { name: "Speakers", type: "playback", volume: 60, isMuted: false },
    { name: "Headphones", type: "playback", volume: 35, isMuted: false },
    { name: "Microphone", type: "recording", volume: 80, isMuted: true }
  ].map((device, index) => ({
    ...device,
    deviceId: `device-${index}`,
    isDefaultPlayback: index === 0,
    isDefaultRecording: index === 2
  }))
};

const size = (bytes: number) => {
  const power = Math.min(4, Math.floor(Math.log2(Math.max(bytes, 1)) / 10));
  const iecValue = bytes / 1024 ** power;
  const iecUnit = ["B", "KiB", "MiB", "GiB", "TiB"][power];
  return { bytes, iecValue, iecUnit, siValue: iecValue, siUnit: iecUnit };
};

const trayIcon = (tooltip: string, color: string) => ({
  id: tooltip,
  tooltip,
  iconUrl: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="${color}"/></svg>`
  )}`
});

const trayAction = (name: string) => (id: string) => {
  console.log(`[mock] tray ${name}:`, id);
  return Promise.resolve();
};

function setDevice(deviceId: string | undefined, changes: object) {
  update({
    devices: state.devices.map((device) =>
      device.deviceId === (deviceId ?? "device-0")
        ? { ...device, ...changes }
        : device
    )
  });
}

function buildOutputMap() {
  const workspaces = WORKSPACE_NAMES.map((name) => {
    const isDisplayed = name === state.displayedWorkspace;
    return {
      type: ContainerType.WORKSPACE,
      id: `workspace-${name}`,
      name,
      displayName: null,
      isDisplayed,
      hasFocus: isDisplayed,
      // The last one stands for a kept-alive workspace, which can be empty.
      children: isDisplayed ? windows : name === "3" ? [] : windows.slice(1, 2)
    };
  });
  const monitor = {
    id: "monitor",
    x: 0,
    y: 0,
    hasFocus: true,
    children: workspaces
  };

  const sessions = [
    {
      sessionId: "Spotify.exe",
      title: "Mock Song",
      artist: "Mock Artist",
      albumTitle: "Mock Album",
      position: 72 + ((Date.now() / 1000) % 60),
      endTime: 210,
      isPlaying: state.isPlaying,
      isCurrentSession: true
    },
    {
      sessionId: "MSEdge",
      title: "A Video With a Longer Title",
      artist: null,
      albumTitle: null,
      position: 30,
      endTime: 600,
      isPlaying: false,
      isCurrentSession: false
    }
  ];

  const playbackDevices = state.devices.filter(
    (device) => device.type === "playback"
  );
  const recordingDevices = state.devices.filter(
    (device) => device.type === "recording"
  );

  return {
    battery: {
      state: "discharging",
      chargePercent: 72,
      healthPercent: 91,
      cycleCount: 214,
      timeTillEmpty: 8_100_000,
      timeTillFull: null
    },
    cpu: {
      usage: 24,
      frequency: 3600,
      physicalCoreCount: 8,
      logicalCoreCount: 16
    },
    date: { new: new Date() },
    disk: {
      disks: [
        {
          name: "Windows",
          mountPoint: "C:\\",
          totalSpace: size(1e12),
          availableSpace: size(4.2e11)
        },
        {
          name: "Games",
          mountPoint: "D:\\",
          totalSpace: size(2e12),
          availableSpace: size(3e11)
        }
      ]
    },
    host: {
      hostname: "MOCK-PC",
      friendlyOsVersion: "Windows 10 Home",
      uptime: 183_000_000
    },
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
      isPaused: false,
      runCommand
    },
    memory: {
      usage: 58,
      usedMemory: 18.6e9,
      totalMemory: 32e9,
      usedSwap: 1e9,
      totalSwap: 4e9
    },
    network: {
      defaultInterface: {
        name: "wlan0",
        friendlyName: "Wi-Fi",
        type: "wifi",
        isDefault: true,
        ipv4Addresses: ["192.168.1.20"],
        dnsServers: ["1.1.1.1", "8.8.8.8"],
        receiveSpeed: 866_000_000,
        transmitSpeed: 866_000_000
      },
      defaultGateway: {
        signalStrength: 80,
        ssid: "Mock Wi-Fi",
        ipv4Addresses: ["192.168.1.1"]
      },
      interfaces: [
        {
          name: "wg0",
          friendlyName: "VPN",
          type: "tunnel",
          isDefault: false,
          ipv4Addresses: ["10.0.0.2"]
        }
      ],
      traffic: {
        received: {
          iecValue: 2.929,
          iecUnit: "KiB",
          bytes: 1000 + Math.random() * 20_000
        },
        transmitted: {
          iecValue: 512,
          iecUnit: "B",
          bytes: 200 + Math.random() * 2000
        },
        totalReceived: size(4.2e10),
        totalTransmitted: size(3.1e9)
      }
    },
    weather: { status: "cloudy_day", celsiusTemp: 22, fahrenheitTemp: 72 },
    media: {
      currentSession: sessions[0],
      allSessions: sessions,
      previous: () => console.log("[mock] previous track"),
      next: () => console.log("[mock] next track"),
      togglePlayPause: () => update({ isPlaying: !state.isPlaying })
    },
    keyboard: { layout: "en-US" },
    audio: {
      defaultPlaybackDevice: playbackDevices[0],
      defaultRecordingDevice: recordingDevices[0],
      playbackDevices,
      recordingDevices,
      setVolume: (volume: number, options?: { deviceId?: string }) => {
        setDevice(options?.deviceId, { volume });
      },
      setMute: (isMuted: boolean, options?: { deviceId?: string }) => {
        setDevice(options?.deviceId, { isMuted });
      }
    },
    systray: {
      icons: [
        trayIcon("Discord", "#5865f2"),
        trayIcon("Steam", "#1b2838"),
        trayIcon("OneDrive: 72%\nUp to date", "#0078d4"),
        trayIcon("Security", "#2e7d32"),
        trayIcon("Bluetooth", "#2979ff"),
        trayIcon("Updates", "#f9a825"),
        trayIcon("Clipboard", "#ad1457")
      ],
      onLeftClick: trayAction("left click"),
      onLeftDoubleClick: trayAction("double click"),
      onRightClick: trayAction("right click"),
      onMiddleClick: trayAction("middle click"),
      onHoverEnter: () => Promise.resolve(),
      onHoverMove: () => Promise.resolve(),
      onHoverLeave: () => Promise.resolve()
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

export function createProvider({ type }: { type: keyof OutputMap }) {
  const provider = {
    output: buildOutputMap()[type],
    onOutput(listener: () => void) {
      const onChange = (outputMap: OutputMap) => {
        provider.output = outputMap[type];
        listener();
      };
      outputListeners.push(onChange);
      provider.stop = () => {
        outputListeners.splice(outputListeners.indexOf(onChange), 1);
        return Promise.resolve();
      };
      listener();
    },
    onError() {},
    stop: () => Promise.resolve()
  };
  return provider;
}

function closeWindow() {
  window.close();
  return Promise.resolve();
}

/** A browser can't hide a window, so one that was shown closes, and the next is new. */
let shown = false;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

export function currentWidget() {
  return {
    close: closeWindow,
    tauriWindow: {
      setEffects: async () => {},
      clearEffects: async () => {},
      setIgnoreCursorEvents: async () => {},
      onMoved: async () => {},
      onResized: async () => {},
      setPosition: async () => {},
      setSize: async () => {},
      show: () => {
        shown = true;
        clearTimeout(hideTimer);
        return Promise.resolve();
      },
      // A popup can't hide, and one that's shown again straight away shouldn't close.
      hide: () => {
        if (shown) {
          shown = false;
          hideTimer = setTimeout(() => void closeWindow(), 100);
        }
        return Promise.resolve();
      },
      close: closeWindow,
      outerPosition: () => Promise.resolve({ x: 0, y: 0 }),
      listen: (event: string, listener: () => void) => {
        const name = event === "tauri://blur" ? "blur" : event;
        window.addEventListener(name, listener);
        return Promise.resolve(() => {
          window.removeEventListener(name, listener);
        });
      }
    }
  };
}

type Placement = { width: string; height: string };

export function startWidget(name: string, placement: Placement) {
  const width = parseFloat(placement.width);
  const height = parseFloat(placement.height);
  // The flyout window, which sizes itself later. A browser only opens one from a press.
  const fromPress = width > 1 || navigator.userActivation.isActive;
  if (fromPress) {
    const size =
      width > 1 ? `width=${width},height=${height}` : "width=480,height=720";
    window.open(`/${name}`, "_blank", `popup,${size}`);
  }
  return Promise.resolve();
}

export function startWidgetPreset(name: string) {
  const { width, height } = zpack.widgets.find((widget) => widget.name === name)
    ?.presets[0] ?? { width: "800px", height: "600px" };
  return startWidget(name, { width, height });
}

export function shellExec(program: string, args: string[]) {
  console.log("[mock] shell command:", program, ...args);
  const stdout =
    program === "reg"
      ? "LocaleName    REG_SZ    en-IL\n    iFirstDayOfWeek    REG_SZ    6"
      : "";
  return Promise.resolve({ stdout, stderr: "", code: 0 });
}

if (typeof document !== "undefined") {
  mockIPC(<T>(command: string) =>
    Promise.resolve((command.endsWith("_monitor") ? MONITOR : null) as T)
  );
  document.documentElement.style.background = "#1e4f8a";

  // In Zebar the bar fills a window with the preset's height, over the desktop.
  if (location.pathname === "/") {
    document.body.style.height = zpack.widgets[0]?.presets[0]?.height ?? "100%";
  }
}
