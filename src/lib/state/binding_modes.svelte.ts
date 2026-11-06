import { untrack } from "svelte";
import { currentWidget } from "zebar";
import { config, configStatus } from "#lib/state/config.svelte.ts";
import { providers } from "#lib/state/providers.svelte.ts";

const bindingModes = $derived(providers.glazewm?.bindingModes || []);
const clickThroughBindingMode = $derived(
  bindingModes.find((mode) => mode.name === "ct") || null
);

const toggleModes = $state({
  clickThrough: false
});

export function initBindingModes() {
  let prevTime = Date.now();

  $effect(() => {
    /* The click through binding mode needs to be configured to be toggled on and off
     * in the GlazeWM config.yaml file, and we just listen for its activation here as
     * a single toggle.
     * For example (config.yaml):
     *
     * # Sends a signal to Zebar via the binding mode
     *  commands: ['wm-enable-binding-mode --name ct', "wm-disable-binding-mode --name ct"]
     *  bindings: ['alt+shift+c']
     *
     *
     * The reason we do it this way is that GlazeWM binding modes do not inherit the
     * default keybindings, so in order to toggle our own custom mode while keeping all the keybindings,
     * we capture the activation signal by toggling the binding mode on and off and
     * save the state (signaled by the flip-flop) in our own Svelte state.
     *
     * If you think of a better way to do this, please let me know!
     */

    // Avoid cycles by untracking the current toggle state
    const currentToggle = untrack(() => toggleModes.clickThrough);

    if (clickThroughBindingMode) {
      const currentTime = Date.now();
      const timeDiff = currentTime - prevTime;

      // throttle
      if (timeDiff < 400) return;

      prevTime = currentTime;
      toggleModes.clickThrough = !currentToggle;
    }
  });

  $effect(() => {
    // Here we use our custom state derived from the binding mode flip-flops
    const window = currentWidget().tauriWindow;
    void window.setIgnoreCursorEvents(toggleModes.clickThrough);
  });

  $effect(() => {
    if (configStatus.loaded) {
      toggleModes.clickThrough = config.clickThroughByDefault;
    }
  });
}

export { toggleModes };
