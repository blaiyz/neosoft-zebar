import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import * as zebar from "zebar";

type EventPayload<T> = {
  type: "update" | "initialization";
  source: string;
  data: T;
};

export function RemoteState<T>(
  stateIdentifier: string,
  initialValue: T,
  onMount: (f: () => void) => void,
  onDestroy: (f: () => void) => void,
  requestInitialization = false
) {
  const state = $state<{ value: T }>({ value: initialValue });
  let currentWindow: WebviewWindow | null = null;

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
      //   `Setting remote state property: ${String(prop)} for ${stateIdentifier} to`,
      //   value
      // );
      target[prop] = value;
      currentWindow?.emit(`remote-state:${stateIdentifier}`, {
        type: "update",
        source: zebar.currentWidget().id,
        data: state.value
      } satisfies EventPayload<T>);

      return true;
    }
  };
  const returnState = new Proxy(state, handler) as typeof state;

  onMount(() => {
    currentWindow = getCurrentWebviewWindow();
    const currentWidgetId = zebar.currentWidget().id;

    const unlistenPromise = currentWindow.listen(
      `remote-state:${stateIdentifier}`,
      (event) => {
        const payload = event.payload as EventPayload<T>;
        if (payload.source === currentWidgetId) {
          // Ignore events emitted by the same instance
          return;
        }

        if (payload.type === "initialization") {
          // console.log(
          //   `Remote state initialization received for ${stateIdentifier} from ${payload.source}`
          // );

          // Forcing an update to trigger the event listener in other instances
          // eslint-disable-next-line no-self-assign
          returnState.value = returnState.value;
          return;
        }

        // console.log(
        //   `Remote state update for ${stateIdentifier}:`,
        //   payload.data
        // );
        state.value = payload.data;
      }
    );

    if (requestInitialization) {
      currentWindow.emit(`remote-state:${stateIdentifier}`, {
        type: "initialization",
        source: currentWidgetId,
        data: state.value
      } satisfies EventPayload<T>);
    }

    onDestroy(() => {
      unlistenPromise.then((unlisten) => {
        unlisten();
      });
    });
  });

  return returnState;
}
