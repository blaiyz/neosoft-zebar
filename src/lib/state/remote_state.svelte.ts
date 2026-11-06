type Message<T> = { ask: true } | { value: T };

/**
 * A value shared between the pack's windows, each of which is a separate app. A
 * window that opens later asks the others for the current value, which arrives a
 * moment after it starts, and `known` says when it has.
 *
 * Replace the value to change it. Nothing watches what's inside it, and all of it
 * is sent on every write, so it should stay small.
 */
export class RemoteState<T> {
  #value: T;
  #known = $state(false);
  #channel: BroadcastChannel | undefined;

  constructor(name: string, initialValue: T) {
    this.#value = $state.raw(initialValue);
    // Component scripts also run in Node, when pages are prerendered.
    if (typeof window === "undefined") return;

    const channel = new BroadcastChannel(`neosoft.state.${name}`);
    channel.onmessage = ({ data }: MessageEvent<Message<T>>) => {
      if ("value" in data) {
        this.#value = data.value;
        this.#known = true;
      } else if (this.#known) {
        channel.postMessage({ value: $state.snapshot(this.#value) });
      }
    };
    channel.postMessage({ ask: true });
    this.#channel = channel;
  }

  get known() {
    return this.#known;
  }

  get value() {
    return this.#value;
  }

  set value(next: T) {
    this.#value = next;
    this.#known = true;
    this.#channel?.postMessage({ value: $state.snapshot(next) });
  }
}
