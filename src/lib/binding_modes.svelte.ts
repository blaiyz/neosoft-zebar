import { untrack } from "svelte";
import { currentWidget } from "zebar";
import { config, configLoaded } from "./config.svelte";
import { providers } from "./providers.svelte";

const bindingModes = $derived(providers.glazewm?.bindingModes || []);
const clickThroughBindingMode = $derived(
  bindingModes.find((mode) => mode.name === "ct") || null
);

const toggleModes = $state({
  clickThrough: false
});

export function initializeBindingModesObserver() {
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

      console.log("Click-through binding mode toggled");
      prevTime = currentTime;
      toggleModes.clickThrough = !currentToggle;
    }
  });

  $effect(() => {
    // Here we use our custom state derived from the binding mode flip-flops
    const window = currentWidget().tauriWindow;
    if (toggleModes.clickThrough) {
      window.setIgnoreCursorEvents(true);
      console.log("Set window to click-through");
    } else {
      window.setIgnoreCursorEvents(false);
      console.log("Unset window to click-through");
    }
  });

  configLoaded.then(() => {
    toggleModes.clickThrough = config.clickThroughByDefault;
  });
}

export { toggleModes };
