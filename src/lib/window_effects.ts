import type { BackgroundEffect } from "#lib/config_schema.ts";
import { Effect } from "@tauri-apps/api/window";
import { currentWidget } from "zebar";

const WINDOW_EFFECTS: Record<Exclude<BackgroundEffect, "inherit">, Effect> = {
  acrylic: Effect.Acrylic,
  blur: Effect.Blur,
  mica: Effect.Mica
};

/**
 * Widgets have been allowed to set window effects since Zebar 3.2. They're set
 * here because `zpack.json` has no option for them, which is proposed in
 * https://github.com/glzr-io/zebar/pull/133.
 */
export async function applyBackgroundEffect(effect: BackgroundEffect) {
  try {
    const window = currentWidget().tauriWindow;
    if (effect === "inherit") {
      await window.clearEffects();
    } else {
      await window.setEffects({ effects: [WINDOW_EFFECTS[effect]] });
    }
  } catch (error) {
    console.error("Error setting window effects:", error);
  }
}
