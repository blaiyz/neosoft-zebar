import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const mockZebar = fileURLToPath(
  new URL("src/lib/mock/zebar.ts", import.meta.url)
);

export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss(), sveltekit()],
  resolve: {
    alias: mode === "mock" ? [{ find: "zebar", replacement: mockZebar }] : []
  },
  server: {
    // The default config and its schema are imported through `$static`.
    fs: { allow: ["static"] }
  }
}));
