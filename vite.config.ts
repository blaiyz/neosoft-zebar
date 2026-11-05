import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const mockZebar = fileURLToPath(
  new URL("src/lib/mock/zebar.ts", import.meta.url)
);

export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter(),
      // A widget pack only changes when Zebar reloads it, so there's no new
      // version to look for.
      version: { pollInterval: 0 }
    })
  ],
  resolve: {
    alias: mode === "mock" ? [{ find: "zebar", replacement: mockZebar }] : []
  },
  server: {
    // The default config and its schema are imported from `static/`.
    fs: { allow: ["static"] }
  }
}));
