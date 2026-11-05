import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export function RemoteState<T>(
  stateIdentifier: string,
  initialValue: T,
  onMount: (f: () => void) => void,
  onDestroy: (f: () => void) => void
) {
  const state = $state<{ value: T }>({ value: initialValue });
  let currentWindow: WebviewWindow | null = null;

  onMount(() => {
    currentWindow = getCurrentWebviewWindow();
    const unlistenPromise = currentWindow.listen(
      `remote-state:${stateIdentifier}`,
      (event) => {
        const data = event.payload as { value: T };
        // console.log(`Remote state update for ${name}:`, data);
        state.value = data.value;
      }
    );
    // console.log(`Mounted remote state for ${name}`);

    onDestroy(() => {
      void unlistenPromise.then((unlisten) => {
        unlisten();
        // console.log(`Unmounted remote state for ${name}`);
      });
    });
  });

  const handler = {
    get<T2>(target: T2, prop: keyof T2): T2[keyof T2] {
      // console.log(
      //   `Accessing remote state property: ${String(prop)} for ${name}`
      // );
      if (typeof target[prop] === "object" && target[prop] !== null) {
        return new Proxy(target[prop], handler) as unknown as T2[keyof T2];
      }
      return target[prop];
    },
    set<T2>(target: T2, prop: keyof T2, value: T2[keyof T2]): boolean {
      // console.log(
      //   `Setting remote state property: ${String(prop)} for ${name} to`,
      //   value
      // );
      target[prop] = value;
      void currentWindow?.emit(`remote-state:${stateIdentifier}`, state);
      return true;
    }
  };
  return new Proxy(state, handler) as typeof state;
}
