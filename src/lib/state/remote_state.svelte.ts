import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { WebviewWindow } from "@tauri-apps/api/webviewWindow";

/**
 * A value shared between widget windows, each of which is a separate app. Writes
 * are broadcast over Tauri events. Call it while a component initializes, because
 * it listens for as long as that component is mounted.
 */
export function RemoteState<T>(stateIdentifier: string, initialValue: T) {
  const state = $state<{ value: T }>({ value: initialValue });
  let currentWindow: WebviewWindow | null = null;

  $effect(() => {
    currentWindow = getCurrentWebviewWindow();
    const unlistenPromise = currentWindow.listen<{ value: T }>(
      `remote-state:${stateIdentifier}`,
      (event) => {
        state.value = event.payload.value;
      }
    );

    return () => {
      void unlistenPromise.then((unlisten) => {
        unlisten();
      });
    };
  });

  const handler = {
    get<T2>(target: T2, prop: keyof T2): T2[keyof T2] {
      if (typeof target[prop] === "object" && target[prop] !== null) {
        return new Proxy(target[prop], handler) as unknown as T2[keyof T2];
      }
      return target[prop];
    },
    set<T2>(target: T2, prop: keyof T2, value: T2[keyof T2]): boolean {
      target[prop] = value;
      void currentWindow?.emit(`remote-state:${stateIdentifier}`, state);
      return true;
    }
  };
  return new Proxy(state, handler) as typeof state;
}
