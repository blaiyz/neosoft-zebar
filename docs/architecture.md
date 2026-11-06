# Architecture

How the widget pack works today. How Zebar itself works is in `research/zebar.md`.

## From source to the screen

SvelteKit compiles `src/` with `@sveltejs/adapter-static` into `build/`, one HTML file per route, with everything in `static/` copied alongside. `build/` is a complete Zebar widget pack: `zpack.json` declares the `default` widget, its window preset and its privileges.

Zebar finds packs one directory below `~/.glzr/zebar/`, and installs marketplace packs under `%AppData%\zebar\downloads\`. For each widget instance it opens a Tauri window pointing at a local server that serves the pack directory. A new build reaches the screen when Zebar reloads, through the tray's "Empty cache & reload configs", or by itself under `pnpm dev`.

## One app per monitor

`monitorSelection: all` starts one instance per monitor, each in its own webview with its own JavaScript heap. There is no shared process:

- Module-level state in `src/lib/` exists once per monitor. `providers.glazewm` reports from that monitor's point of view (`currentMonitor`, `currentWorkspaces`).
- `src/lib/state/autotiler.svelte.ts` ignores focus changes on other monitors, so exactly one instance reacts to each one.
- `isOnPrimaryMonitor()` compares Tauri's current and primary monitors the way Zebar does, by name, position and size, so it works without GlazeWM. It starts as `false` and rechecks when the window moves or resizes.
- Each instance sets its own click-through state.
- `RemoteState` (`src/lib/state/remote_state.svelte.ts`) wraps a value in a proxy that broadcasts writes through Tauri events, for state shared between windows. Only the `test` route uses it.

## Startup

`src/app.html` preloads `config.json`, relative to the page, and an inline script paints the saved theme so that the default look doesn't flash. Then:

1. `src/routes/+page.svelte` runs `initAutotiler()`, `initBindingModes()` and `initProviders()` during component init. These register `$effect`s, which don't run during prerender.
2. On mount, `+page.svelte` calls `initMonitor()`, which works out whether this is the primary monitor.
3. On mount, `+layout.svelte` calls `loadConfig()`. It applies the stored document at once, then imports `config.json` and `custom.css` if they changed, and sets `configStatus.loaded`. It can't fail: anything it can't read becomes an entry in `configStatus.issues`.
4. Effects that need the user's settings wait for `configStatus.loaded`. `syncProviders()` then starts only the providers that its sections need, and copies each output into the `providers` `$state`. The theme, the background effect and the click-through default are applied the same way.

These effects keep running, so a change to the settings applies without a reload, in every window.

The UI renders before all of this finishes, with defaults and `null` providers, so components guard with `{#if}` or optional chaining.

Prerendering runs component scripts in Node at build time, which is why every call into `zebar`, Tauri or `window` sits in `onMount`, `$effect` or an event handler. Importing those packages at the top level is fine.

## Reactive state

Shared state is in `.svelte.ts` modules in `src/lib/state/`, so it can use runes outside components:

- `config.svelte.ts`: `config`, `configStatus`, `loadConfig`.
- `layout.svelte.ts`: `isSectionShown`, and fitting the bar to its width (see below).
- `providers.svelte.ts`: `providers`, `initProviders`. Components take what they need with `$derived(providers.x)`.
- `binding_modes.svelte.ts`: `toggleModes`.
- `monitor.svelte.ts`: `initMonitor`, `isOnPrimaryMonitor`.

Local UI state stays in components. `AnimatedList` animates items entering, leaving and moving, and `Reveal` does the same for a single piece of content. They position items from measured widths and move them with CSS transitions. Svelte's `animate:` and `transition:` directives aren't used for this, because they jump when interrupted: an item still animating stays in the layout when it starts to leave, and one that returns partway through doesn't move. Both take their duration from `bar.transitionDuration`.

`Collapsible` hides and shows content whose width can change while it does, through a grid track going between `0fr` and `1fr`. The track takes its size from the content on every frame, so it can't lag the way a list that sets a width can.

## Configuration

A widget can't write files, and a marketplace install gets a new folder for each version, so nothing the pack ships can hold settings across updates. `docs/research/multi-window-and-persistence.md` has the evidence.

Settings are therefore one JSON document in `localStorage`, which is shared by every window of the pack and survives updates. Only `zpack.json` stays a file, because Zebar reads the window's height and docked edge when it creates the window.

- **The schema is the source of truth.** The Zod schema in `src/lib/config_schema.ts` has no `$state`, so scripts can import it too. `Config`, the defaults and validation all come from it. `pnpm schema` turns it, with its descriptions, into `static/schema.json`, which the user's editor picks up through `$schema`.
- **The document is partial.** It holds only what the user set, so a changed default reaches everyone who didn't choose a value. Every key has a default, and nested objects are filled in key by key. Unknown keys are dropped rather than rejected.
- **Validation drops keys, not documents.** `parseDocument()` in `src/lib/config_document.ts` removes each key that fails and parses again, because a stored document can't be fixed by hand. The issues go to `configStatus.issues`, which `ConfigWarning.svelte` shows.
- **`config.json` is an import.** `static/config.json` holds only `$schema` and `version`, and `pnpm check` keeps it that way, because anything in it would be merged over the user's settings. At startup the file's text is compared with the text last imported. If it changed, its keys are merged into the document, and otherwise it's ignored, so whichever changed last wins.
- **`custom.css` is an import too.** Its text becomes `theme.customCss`, so a stylesheet can be written as a real file. The pack doesn't ship one: an update would replace a template, and its text would count as a change and wipe the stored CSS. A missing file is a 404, which leaves the stored CSS alone, and Zebar's service worker doesn't cache those, so a file created later is found.
- **Versions.** `src/lib/config_migrations.ts` upgrades documents one version at a time. A document with no version counts as v1, because v1 files had none. A step that stops `true` from carrying over is deliberate: v1 files repeated every default, so `true` only meant the user left the option alone.
- **A backup.** The previous document is kept under a second key before a migration or an import, and before unreadable data is discarded.
- **Windows stay in step.** After a write, `BroadcastChannel` tells the other windows to read the document again. `syncState()` copies only the values that differ, so a change doesn't wake everything that reads `config`.

Sections are listed in `src/lib/sections.ts`, in display order, which is all `LeftGroup` and `RightGroup` render from. Their components are in `section_components.ts`, because the list is also imported by the schema, which runs in Node. `isSectionShown()` decides what appears.

## Fitting the bar

Every window fits its own bar, in `src/lib/state/layout.svelte.ts`. The grid's columns are `minmax(0,1fr) auto minmax(0,1fr)`, so a side can't widen its column and the middle stays centred. Each side has to fit inside its column.

- **Parts** are what can give way: a whole section, or a piece of one. `sections.ts` has them in `partSides`, with the order they go in as `collapseSteps`. A part stays rendered while it's hidden, clipped by `Collapsible`, so its width is always known. Parts that don't hide, such as the workspace buttons, report their widths from invisible copies.
- **`fit()`** in `src/lib/utils/fit.ts` is a pure function. It takes what each side would need with everything at its widest, and walks the steps in order, taking only those that help a side that doesn't fit. A step for a part in the middle counts half for each side, because the column on either side gains half of it. With taskbar integration the workspaces sit over the end of the left column, so their steps count for the left side alone, and their width comes out of its room.
- **Pins:** a section set to `true`, or a specific form like `"interface"`, isn't offered as a step, so its width comes out of what the others can have.
- **Preferences:** `preferPart()` is for what the user asked for by clicking, like the slider. The others give way to it, but if all of them together can't make room, it goes instead and they stay as they were. `fit()` tries the steps without it first to find out. The chevron and the volume slider go together: `placeVolumeSlider()` works out whether the slider could fit even while it's closed, and hides the chevron if it couldn't, so there's never a button that does nothing.
- **Timing:** a `ResizeObserver` watches the columns, the groups and every part. Giving way happens at once. Coming back waits a second and needs a little room to spare, so that a new track title can't make sections bounce.

A part must not be inside an `AnimatedList`. The list would lag behind the part, and the fit would count the same width twice for as long as the two disagree. A part must not be inside another part for the same reason, which is why `NetworkStatus` is three parts side by side. The spacing between sections is inside what collapses, so that nothing stays behind.

## Styling

Three layers of CSS variables, all HSL triplets without commas:

1. `src/themes/*.css` define palettes. They are imported in `src/app.css`, so every palette is bundled.
2. `src/themes/presets.css` maps semantic names to a palette (`--text: var(--tau-text)`), one block per `[data-theme]`, and sets the default sizes. A color may carry an alpha (`--bg-focused: ... / 0.4`). It sits in the `presets` layer, the lowest one. The values in `theme` go in an `overrides` layer above it, so they replace the preset, and `theme.customCss` has no layer, so it beats both without needing specificity.
3. `@theme inline` in `src/app.css` exposes the semantic names as `zb-*` utilities through `hsl(var(--name))`. Being inline, the values go straight into the utilities, as `--transition-duration` is set below `:root` and a theme variable there couldn't resolve it.

`applyTheme()` in `src/lib/theme.ts` turns `theme` into a snapshot: the preset, the variables for the `overrides` layer and the custom CSS. The function that paints it lives in `src/app.html`, so that the same code can run before the app loads, and the snapshot is saved for that. It is separate from the document because the inline script can't validate one.

Fonts are bundled, so the bar needs no network to look right. `src/app.css` imports Montserrat from `@fontsource-variable/montserrat` and loads `src/lib/fonts/weather.woff2`, a subset holding only the glyphs in `Weather.svelte`. A new glyph means subsetting again. `static/font-licenses.txt` ships their licenses with the pack.

`src/app.css` also applies a global transition to color-like properties on `*`, with its duration set from `bar.transitionDuration` on the root element of `+layout.svelte`. Sizes derive from `--font-size`, so scaling the bar means raising the font size and the height in `zpack.json` together.

## GlazeWM integration

GlazeWM is reached through the `glazewm` provider, whose `runCommand` issues WM commands. It is optional at runtime: `providers.glazewm` stays `null` without it.

Click-through relies on a GlazeWM binding mode. A keybinding enables and immediately disables a mode named `ct`, and `binding_modes.svelte.ts` treats each activation as one toggle of its own state, throttled so that the instance on each monitor stays in step. The reason is explained in a comment in that file: binding modes don't inherit the default keybindings, so staying in the mode isn't an option.

## Privileged actions

`zebar.shellExec` only runs what `privileges.shellCommands` in `zpack.json` allows, so each new command needs a rule there, in `static/zpack.json` and in `dev_static/zpack.json` to work in dev builds. Tauri window calls are limited by the permissions Zebar ships.

## Builds

- `pnpm dev` runs `vite build --watch` in the `dev` mode. `vite.config.ts` wraps the adapter in that mode, so each build ends by copying `dev_static/` over `build/`. A developer's personal configuration ends up there, and anything missing from it keeps the `static/` version. `dev_static/` is created from `static/` on first use and isn't refreshed after that.
- The last step of a `dev` build writes `dev-build.txt`. `src/lib/dev_reload.ts`, which only exists in that mode, polls the file and reloads the page when it changes. Being a file in the pack, it needs no server, port or CORS.
- `pnpm dev:once` runs the same build once.
- `scripts/build.js` (`pnpm build`) builds, then copies `README.md` and `LICENSE` into `build/`, because `zebar publish` only packs them from the root of the pack. Marketplace preview images are small copies in `static/preview/`. The full-size screenshots stay in `misc/`, outside the package, and the README links to them on GitHub.
- `pnpm dev:mock` runs the Vite dev server in the `mock` mode, where `vite.config.ts` aliases `zebar` to `src/lib/mock/zebar.ts`. The real package throws outside Zebar, so this is what lets the UI run in a browser. Its data is fixed, and it's never part of a build.

## CI and releases

- `ci.yml` runs `pnpm lint`, `pnpm check`, actionlint, zizmor and the build on pushes to `main` and on pull requests. The build is `build.yml`, a reusable workflow, so CI, `release.yml` and `publish-marketplace.yml` all build the same way. The composite action in `.github/actions/setup` installs pnpm, Node and the locked dependencies.
- `publish-rehearsal.yml` runs on pull requests that touch packaging, or by hand. It runs `scripts/publish.sh`, the same script as a real publish, against `scripts/publish_stub.ts`, a local stand-in that checks the form fields and the tarball. Nothing reaches the marketplace, and the marketplace's own validation isn't covered.
- `release.yml` is started by hand. It builds, zips `build/` and creates a GitHub release with `gh release create`.
- `publish-marketplace.yml` runs when a release is published, building its tag, or by hand, building the ref it's started on. `.github/actions/zebar-cli` installs a pinned Zebar build, and `scripts/publish.sh` runs `zebar publish` with `ZEBAR_PUBLISH_TOKEN`, passing the version from the tag.

The steps are in `.claude/skills/release/SKILL.md`.
