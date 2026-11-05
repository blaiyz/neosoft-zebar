# Architecture

How the widget pack works today. How Zebar itself works is in `research/zebar.md`.

## From source to the screen

SvelteKit compiles `src/` with `@sveltejs/adapter-static` into `build/`, one HTML file per route, with everything in `static/` copied alongside. `build/` is a complete Zebar widget pack: `zpack.json` declares the `default` widget, its window preset and its privileges.

Zebar finds packs one directory below `~/.glzr/zebar/`, and installs marketplace packs under `%AppData%\zebar\downloads\`. For each widget instance it opens a Tauri window pointing at a local server that serves the pack directory. Rebuilding changes nothing on screen until Zebar reloads, through the tray's "Empty cache & reload configs".

## One app per monitor

`monitorSelection: all` starts one instance per monitor, each in its own webview with its own JavaScript heap. There is no shared process:

- Module-level state in `src/lib/` exists once per monitor. `providers.glazewm` reports from that monitor's point of view (`currentMonitor`, `currentWorkspaces`).
- `src/lib/autotiler.svelte.ts` ignores focus changes on other monitors, so exactly one instance reacts to each one.
- `isOnPrimaryMonitor()` treats the monitor at (0, 0) as primary.
- Each instance sets its own click-through state.
- `RemoteState` (`src/lib/remote_state.svelte.ts`) wraps a value in a proxy that broadcasts writes through Tauri events, for state shared between windows. Only the `test` route uses it.

## Startup

`src/app.html` links `config.css` and preloads `config.json`, both relative to the page. Then:

1. `src/routes/+page.svelte` runs `initializeAutotiler()` and `initializeBindingModesObserver()` during component init. These only register `$effect`s, which don't run during prerender.
2. On mount, `+page.svelte` calls `initProviders()` and queues the `backgroundEffect` setup. Both wait for `configLoaded`, because a child's `onMount` runs before its parent's. `initProviders()` then applies the configured refresh intervals (or keeps the defaults if loading failed), creates the Zebar provider group, and copies each output into the `providers` `$state`.
3. On mount, `+layout.svelte` calls `loadConfig()`. It fetches `config.json`, parses it with JSON5 (so comments are allowed), validates it against the schema, deep-merges it over the defaults into the `config` `$state`, and resolves `configLoaded`. On any failure it logs to the console and rejects `configLoaded`, leaving the defaults in place.

The UI renders before all of this finishes, with defaults and `null` providers, so components guard with `{#if}` or optional chaining.

Prerendering runs component scripts in Node at build time, which is why every call into `zebar`, Tauri or `window` sits in `onMount`, `$effect` or an event handler. Importing those packages at the top level is fine.

## Reactive state

Shared state is in `.svelte.ts` modules so it can use runes outside components:

- `config.svelte.ts`: `config`, `configLoaded`, `loadConfig`.
- `providers.svelte.ts`: `providers`, `initProviders`. Components take what they need with `$derived(providers.x)`.
- `binding_modes.svelte.ts`: `toggleModes`.

Local UI state stays in components. `SmoothDiv` animates size changes using a `Spring` driven by `transitionDuration`.

## Configuration

Users configure the pack through three files that ship in the build: `config.json`, `config.css` and `zpack.json`.

`config.json` flows like this:

- `Config` in `src/lib/config.svelte.ts` is the source of truth. `pnpm schema` turns it, with its JSDoc, into `static/schema.json`, which the user's editor picks up through `$schema` and which is also bundled for runtime validation.
- `static/config.json` is both the compiled-in defaults (through `#static`) and the file users edit.
- `deepMergeObjects` walks only the keys of the defaults, so a key absent from the defaults has no effect. Arrays replace rather than merge.
- The schema has no required fields, so partial files are valid. It doesn't reject unknown keys either.

## Styling

Three layers of CSS variables, all HSL triplets without commas:

1. `src/themes/*.css` define palettes. They are imported in `src/app.css`, so every palette is bundled.
2. `static/config.css` maps semantic names to a palette (`--text: var(--tau-text)`) and sets sizes, fonts and radii. It isn't bundled, so editing it needs no rebuild. A color may carry an alpha (`--bg-focused: ... / 0.4`).
3. `@theme inline` in `src/app.css` exposes the semantic names as `zb-*` utilities through `hsl(var(--name))`. Being inline, the values go straight into the utilities, as `--transition-duration` is set below `:root` and a theme variable there couldn't resolve it.

`src/app.css` also applies a global transition to color-like properties on `*`, with its duration set from `transitionDuration` on the root element of `+layout.svelte`. Sizes derive from `--font-size`, so scaling the bar means raising the font size and the height in `zpack.json` together.

## GlazeWM integration

GlazeWM is reached through the `glazewm` provider, whose `runCommand` issues WM commands. It is optional at runtime: `providers.glazewm` stays `null` without it.

Click-through relies on a GlazeWM binding mode. A keybinding enables and immediately disables a mode named `ct`, and `binding_modes.svelte.ts` treats each activation as one toggle of its own state, throttled so that the instance on each monitor stays in step. The reason is explained in a comment in that file: binding modes don't inherit the default keybindings, so staying in the mode isn't an option.

## Privileged actions

`zebar.shellExec` only runs what `privileges.shellCommands` in `zpack.json` allows, so each new command needs a rule there, in `static/zpack.json` and in `dev_static/zpack.json` to work in dev builds. Tauri window calls are limited by the permissions Zebar ships.

## Builds

- `scripts/dev_build.js` (`pnpm dev`) swaps `dev_static/` into the place of `static/` for the length of `vite build`, so a developer's personal configuration ends up in `build/` and in the `#static` imports. `dev_static/` is created from `static/` on first use and isn't refreshed after that.
- `scripts/build.js` (`pnpm build`) copies `README.md` and `misc/` into `static/` for marketplace preview images, then builds.
- `pnpm dev:mock` runs the Vite dev server in the `mock` mode, where `vite.config.ts` aliases `zebar` to `src/lib/mock/zebar.ts`. The real package throws outside Zebar, so this is what lets the UI run in a browser. Its data is fixed, and it's never part of a build.

## CI and releases

- `lint.yml` runs `pnpm lint` and `pnpm check`, and `build.yml` runs `pnpm build`, on pushes to `main` and on pull requests.
- `release.yml` is started by hand. It builds, zips `build/` and creates a GitHub release.
- `publish-marketplace.yml` runs when a release is published, or by hand. It downloads a pinned Zebar build and runs `zebar publish` with `ZEBAR_PUBLISH_TOKEN`, passing the version from the tag.

The steps are in `.claude/skills/release/SKILL.md`.
