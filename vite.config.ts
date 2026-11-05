import adapter from "@sveltejs/adapter-static";
import type { Adapter } from "@sveltejs/kit";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { cpSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const DEV_ASSETS = "dev_static";

const mockZebar = fileURLToPath(
  new URL("src/lib/mock/zebar.ts", import.meta.url)
);

/**
 * Finishes a dev build by putting the personal assets over the default ones.
 * The marker comes last, so `src/lib/dev_reload.ts` never reloads the widget
 * into a half-written folder.
 */
function finishDevBuild(base: Adapter): Adapter {
  return {
    ...base,
    async adapt(builder) {
      await base.adapt(builder);
      cpSync(DEV_ASSETS, "build", { recursive: true });
      writeFileSync("build/dev-build.txt", Date.now().toString());
    }
  };
}

/** Rebuilds on changes to the personal assets, which nothing imports. */
function watchDevAssets(): Plugin {
  return {
    name: "watch-dev-assets",
    buildStart() {
      for (const file of readdirSync(DEV_ASSETS)) {
        this.addWatchFile(`${DEV_ASSETS}/${file}`);
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const isDev = mode === "dev";
  if (isDev && !existsSync(DEV_ASSETS)) {
    cpSync("static", DEV_ASSETS, { recursive: true });
  }

  return {
    plugins: [
      tailwindcss(),
      sveltekit({
        preprocess: vitePreprocess(),
        adapter: isDev ? finishDevBuild(adapter()) : adapter(),
        // A widget pack only changes when Zebar reloads it, so there's no new
        // version to look for.
        version: { pollInterval: 0 }
      }),
      isDev && watchDevAssets()
    ],
    resolve: {
      alias: mode === "mock" ? [{ find: "zebar", replacement: mockZebar }] : []
    },
    server: {
      // The default config and its schema are imported from `static/`.
      fs: { allow: ["static"] }
    }
  };
});
