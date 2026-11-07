import { config, updateSetting } from "#lib/state/config.svelte.ts";
import { hexToHsl } from "#lib/utils/color.ts";
import { throttle } from "#lib/utils/throttle.ts";
import { onDestroy } from "svelte";

/** How often a color being picked is saved, in milliseconds. */
const SAVE_EVERY = 200;

/**
 * The color a theme color has now, and a picker for it that saves as it goes, at
 * most every `SAVE_EVERY`, and once more when it closes.
 *
 * Call while a component initializes.
 */
export function colorPicker(name: () => string) {
  let value = $state("");
  /** While the picker is open, it shows the color, not what's been saved so far. */
  let picking = false;

  // The color comes from the stylesheets, which update after the settings do. Any
  // of the theme can change it, through a color it points at or the custom CSS.
  $effect(() => {
    const color = name();
    void JSON.stringify(config.theme);

    const frame = requestAnimationFrame(() => {
      if (picking) return;
      value = getComputedStyle(document.documentElement)
        .getPropertyValue(`--${color}`)
        .trim();
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  });

  const save = throttle((color: string) => {
    updateSetting(`theme.colors.${name()}`, color);
  }, SAVE_EVERY);
  onDestroy(save.flush);

  return {
    get value() {
      return value;
    },
    /** Takes a color from the picker, keeping the alpha the color had. */
    pick: (hex: string) => {
      const [, alpha] = value.split("/");
      const suffix = alpha === undefined ? "" : ` /${alpha}`;
      picking = true;
      value = `${hexToHsl(hex)}${suffix}`;
      save(value);
    },
    finish: () => {
      picking = false;
      save.flush();
    }
  };
}
