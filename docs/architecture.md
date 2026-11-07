# Architecture

How the widget pack works today. How Zebar itself works is in `research/zebar.md`.

## From source to the screen

SvelteKit compiles `src/` with `@sveltejs/adapter-static` into `build/`, one HTML file per route, with everything in `static/` copied alongside. `build/` is a complete Zebar widget pack: `zpack.json` declares its widgets (`default`, the bar, plus `flyout` and `settings`), with their window presets and privileges.

Zebar finds packs one directory below `~/.glzr/zebar/`, and installs marketplace packs under `%AppData%\zebar\downloads\`. For each widget instance it opens a Tauri window pointing at a local server that serves the pack directory. A new build reaches the screen when Zebar reloads, through the tray's "Empty cache & reload configs", or by itself under `pnpm dev`.

## One app per monitor

`monitorSelection: all` starts one instance per monitor, each in its own webview with its own JavaScript heap. There is no shared process:

- Module-level state in `src/lib/` exists once per monitor. `providers.glazewm` reports from that monitor's point of view (`currentMonitor`, `currentWorkspaces`).
- `src/lib/state/autotiler.svelte.ts` ignores focus changes on other monitors, so exactly one instance reacts to each one.
- `isOnPrimaryMonitor()` compares Tauri's current and primary monitors the way Zebar does, by name, position and size, so it works without GlazeWM. It starts as `false` and rechecks when the window moves or resizes.
- Each instance sets its own click-through state.
- `RemoteState` (`src/lib/state/remote_state.svelte.ts`) is a value shared between windows over `BroadcastChannel`. It's replaced whole, and a window that opens later asks the others for it. It holds what's true right now and is lost when every window closes, so it suits the open flyout, a pending shutdown and recent readings, while settings go through the config document.

## Startup

`src/app.html` preloads `config.json`, relative to the page, and an inline script paints the saved theme so that the default look doesn't flash. Then:

1. `src/routes/+page.svelte` runs `initAutotiler()`, `initBindingModes()`, `initProviders()` and `initHistory()` during component init. These register `$effect`s, which don't run during prerender.
2. On mount, `+page.svelte` calls `initMonitor()`, which works out whether this is the primary monitor.
3. On mount, `+layout.svelte` calls `loadConfig()`. It applies the stored document at once, then imports `config.json` and `custom.css` if they changed, and sets `configStatus.loaded`. It can't fail: anything it can't read becomes an entry in `configStatus.issues`.
4. Effects that need the user's settings wait for `configStatus.loaded`. `syncProviders()` then starts only the providers that its sections need, and copies each output into the `providers` `$state`. The theme, the background effect and the click-through default are applied the same way.

These effects keep running, so a change to the settings applies without a reload, in every window.

The UI renders before all of this finishes, with defaults and `null` providers, so components guard with `{#if}` or optional chaining.

Prerendering runs component scripts in Node at build time, which is why every call into `zebar`, Tauri or `window` sits in `onMount`, `$effect` or an event handler. Importing those packages at the top level is fine.

## Reactive state

Shared state is in `.svelte.ts` modules in `src/lib/state/`, so it can use runes outside components:

- `config.svelte.ts`: `config`, `configStatus`, `loadConfig`, and `updateConfig` and `updateSetting` for anything that saves a setting.
- `layout.svelte.ts`: `isSectionShown`, and fitting the bar to its width (see below).
- `providers.svelte.ts`: `providers`, `initProviders`. Components take what they need with `$derived(providers.x)`. Each window names the providers it wants, and sections turned off still win.
- `flyouts.svelte.ts`: `opensFlyout`, `openFlyout`, `closeFlyout`.
- `history.svelte.ts`: recent readings for the flyouts' graphs. `power.svelte.ts`: a pending shutdown.
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
- **Windows write through one path.** `updateConfig()` validates the change alone, so a bad value is refused without touching anything, then merges it, stores it and tells the others. A key set to `undefined` goes back to its default.
- **Sharing.** `exportConfig()` writes what differs from the defaults, as the same format `config.json` uses. `importConfig()` merges a file in any version, after saving a backup, and `undoConfigChange()` swaps the document with the backup, so an undo can be undone.
- **Windows stay in step.** After a write, `BroadcastChannel` hands the other windows the document. It carries the document itself because a write to `localStorage` can reach another window after the message does. `syncState()` copies only the values that differ, so a change doesn't wake everything that reads `config`.

Sections are listed in `src/lib/sections.ts`, in display order, which is all `LeftGroup` and `RightGroup` render from. Their components are in `section_components.ts`, because the list is also imported by the schema, which runs in Node. `WorkspaceRow.svelte` and `MediaControls.svelte` draw the looks of `workspaces.style` and `media.style` from plain data, without reading a provider, which is what lets the settings window preview them with the real components. `isSectionShown()` decides what appears: every section stays mounted inside a `Collapsible`, so that one turned on or off in the settings animates like one that gives way for room. A section with a provider opens once there's output to show, and a stopped provider keeps its last output until its section has closed.

## Fitting the bar

Every window fits its own bar, in `src/lib/state/layout.svelte.ts`. The grid's columns are `minmax(0,1fr) auto minmax(0,1fr)`, so a side can't widen its column and the middle stays centred. Each side has to fit inside its column.

- **Parts** are what can give way: a whole section, or a piece of one. `sections.ts` has them in `partSides`, with the order they go in as `collapseSteps`. A part stays rendered while it's hidden, clipped by `Collapsible`, so its width is always known. Parts that don't hide, such as the workspace buttons, report their widths from invisible copies.
- **`fit()`** in `src/lib/utils/fit.ts` is a pure function. It takes what each side would need with everything at its widest, and walks the steps in order, taking only those that help a side that doesn't fit. A step for a part in the middle counts half for each side, because the column on either side gains half of it. With taskbar integration the workspaces sit over the end of the left column, so their steps count for the left side alone, and their width comes out of its room.
- **Pins:** a section set to `true`, or a specific form like `"interface"`, isn't offered as a step, so its width comes out of what the others can have.
- **Preferences:** `preferPart()` is for what the user asked for, like the date with `clock.fullDate` set to `"preferred"`. The others give way to it, but if all of them together can't make room, it goes instead and they stay as they were. `fit()` tries the steps without it first to find out. A click tries it in its own window before saving it, so that what can't fit leaves nothing behind.
- **Timing:** a `ResizeObserver` watches the columns, the groups and every part. Giving way happens at once. Coming back waits a second and needs a little room to spare, so that a new track title can't make sections bounce.

A part must not be inside an `AnimatedList`. The list would lag behind the part, and the fit would count the same width twice for as long as the two disagree. A part must not be inside another part for the same reason, which is why `NetworkStatus` is three parts side by side. The spacing between sections is inside what collapses, so that nothing stays behind.

## Flyouts

A bar can't draw outside its window, so flyouts live in a window of their own. A new window takes around a second to show anything, so there's one, started ahead of time by the bar on the primary monitor and kept hidden, and it serves every flyout on every monitor. `src/lib/flyouts.ts` lists the views, each with its window size and the providers it reads. The window keeps those providers running and loads every view when it starts, so that a view opens with its data. The components are in `src/lib/components/flyouts/`.

- **Opening.** `opensFlyout()` is an attachment for the element that opens one. It works out where the window goes from that element's rectangle and the bar's position on its monitor, on whichever side of the bar is further from the screen's edge.
- **Knowing what to show.** The opener puts a request in `openFlyout`, a `RemoteState`, with the view and the window's place in physical pixels. The window moves, resizes and shows itself to match, and hides when the request goes away. Changes are handled one at a time, so that a quick close can't be overtaken by the open it follows.
- **One window.** `flyoutWindow` says whether it's running. If it isn't when a flyout opens, because it hasn't started yet or something closed it, the opener starts it, and it finds the request when it loads. A Web Lock makes any second window close itself, which also covers Zebar bringing the window back after a reload.
- **Focus.** A widget isn't allowed `setFocus`, but `show()` activates a hidden window, and Windows lets it take the foreground because a press on the bar has just gone to this app. That needs `focused` on in `zpack.json`: with it off, Tao shows the window without activating it every time, so no blur would ever arrive. The cost is that the window holds focus for a moment when it starts. `show()` does nothing to a window that's already showing, so one flyout replaces another by hiding the window first. The window paints nothing before hiding, because it would otherwise come back with its last frame.
- **Closing.** A flyout closes on `tauri://blur`, on Escape, on a press in the see-through part of its window, or when `openFlyout` is cleared. That last one is how a press on the bar closes one if the blur doesn't arrive. Zebar's `isFocused()` can't be trusted here. The panel animates out before the window hides, unless another request is already waiting.
- **Melting into the bar.** A flyout on an attached bar grows out of the group that holds its opener, as one shape. `meltOnto()` places it and each side gets a `MeltEdge`. Inside the group, the side flares outward in the flyout window, which is wider by a radius on that side. Past the group's end, the panel rounds its own corner and the group draws a fillet up to meet it. Those fillets are in `Group.svelte`, because they're outside the flyout's window. Within two radii of the group's end there's no room for both curves, so the side lines up with the group, which squares off its corner. `melt` tells a `Group` what to do, and only the bar that opened the flyout has it set. On a floating bar, flyouts float too.
- **The press that closes one.** It's also a press on the opener, so opening and closing both happen on `pointerdown`, which comes before the blur, while the flyout can still be told apart from one that has closed. A click from the keyboard has no press, and is told apart by a `detail` of 0.
- **Size.** Each window is as big as its view can get, and the panel sits against the bar's side. The rest of the window is transparent.
- **The week.** The calendar starts its week from Windows' regional format, which `region.svelte.ts` reads from the registry. The webview only reports the display language, and the two can disagree.
- **Recent readings.** The bar on the primary monitor records them in `history`, because the flyout window starts later and can be closed.

Zebar runs one provider for each config, shared by every window that asks for it, and it never counts them: the first window to stop one stops it for all, and the stops that follow fail. That's harmless here, because a provider only stops when the settings change, and every window follows the same settings.

The tray section is the one place that has to be careful with providers: nothing may create `systray` unless `sections.tray` allows it, because the provider can break the native tray on Windows 10. `createProviderConfig()` is what enforces that, for every window. Stopping it gives the native tray back, but Zebar 3.3.1 can only start it once each time it runs: its tray spy keeps a global that can only be set once, so a second start fails without reporting anything. Icons are matched by `arrangeTray()` in `src/lib/utils/tray.ts` using their tooltips, because Zebar's ids change on every update.

## The settings window

`src/routes/settings/` is a normal window. A widget isn't allowed to start a native drag, so `TitleBar.svelte` moves it with `setPosition`, from screen coordinates that don't change as the window moves under the pointer. It has no button on the taskbar, because GlazeWM ignores Zebar's windows, so taskbar integration couldn't make room for one. The settings button on the bar shows that it's open instead, and closes it. `settings_window.svelte.ts` keeps one window at a time with a Web Lock, the way the flyout window does, and the button asks the browser whether the lock is held before choosing to open or close, because the browser lets go of the lock however the window ends. The dock in the title bar switches pages. Everything about one part of the bar is in one place: on the Sections page, `BarMap.svelte` is a small copy of the bar that picks which part's settings are shown below it. Each page has a color of its own from the theme, set as `--tone`, which the controls inside it take on.

Forms come from `static/schema.json` through `fieldsOf()` in `src/lib/config_form.ts`. Each key's type, values and description are already there, so a new key has a form as soon as a page shows its group. Lists and free-form objects have no general form, and pages handle those themselves, like the theme colors and `bar.primaryMonitorOnly`.

## Styling

Three layers of CSS variables, all HSL triplets without commas:

1. `src/themes/*.css` define palettes. They are imported in `src/app.css`, so every palette is bundled.
2. `src/themes/presets.css` maps semantic names to a palette (`--text: var(--tau-text)`), one block per `[data-theme]`, and sets the default sizes. A color may carry an alpha (`--bg-focused: ... / 0.4`). It sits in the `presets` layer, the lowest one. The values in `theme` go in an `overrides` layer above it, so they replace the preset, and `theme.customCss` has no layer, so it beats both without needing specificity.
3. `@theme inline` in `src/app.css` exposes the semantic names as `zb-*` utilities through `hsl(var(--name))`. Being inline, the values go straight into the utilities, as `--transition-duration` is set below `:root` and a theme variable there couldn't resolve it.

`applyTheme()` in `src/lib/theme.ts` turns `theme` into a snapshot: the preset, the variables for the `overrides` layer and the custom CSS. The function that paints it lives in `src/app.html`, so that the same code can run before the app loads, and the snapshot is saved for that. It is separate from the document because the inline script can't validate one.

Fonts are bundled, so the bar needs no network to look right. `src/app.css` imports Figtree and JetBrains Mono from `@fontsource-variable`, and loads `src/lib/fonts/weather.woff2`, a subset holding only the glyphs in `Weather.svelte`. A new glyph means subsetting again. `static/font-licenses.txt` ships their licenses with the pack.

Surfaces and muted text are tones mixed from a theme's own `--text` and `--bg`, as `--surface-1` to `--surface-3`, `--dim` and `--faint`. They're declared again on every `[data-theme]`, because a value with `var()` in it resolves where it's declared, and the settings window draws each theme's tile inside the current theme. `--tone` is a color passed down to controls, and defaults to the accent.

Motion is on the same scale everywhere. `bar.transitionDuration` sets `--transition-duration` on the root element of `+layout.svelte`, along with `--time-soft`, `--time-melt` and `--time-exit` derived from it, and things leave faster than they arrive. `--spring-soft`, `--spring-melt` and `--spring-pop` in `presets.css` are springs written as `linear()` curves. `--spring-melt` never overshoots, because a flyout's rise is clipped by its window and has nothing behind it to overshoot onto. What the hand moves, like a slider, uses Svelte's `Spring` instead, because it has to be able to change direction partway. A setting with no animation of its own, listed in `lookOf()` in `config.svelte.ts`, fades over through a view transition. The theme's colors are the exception: they're stored as triplets, which can't interpolate, so instead `recolor()` sets `recoloring` on the root for the length of a fade, and `app.css` then transitions every color property on every element. Gradients drawn by hand take their colors from `--fill` and `--fill-end`, which are registered as colors so that they can ease too. The flyout window skips the fade, because it's usually hidden and a transition would wait for a frame, and so does the settings window, whose controls animate their own changes.

Zebar adds its own `normalize.css` to every widget when the document loads, outside any cascade layer. That would put it above all of Tailwind, utilities included, and it sets margins, font sizes and line heights on buttons and inputs. Tailwind's base styles cover the same ground, so `src/app.html` removes it as soon as it's added, which also keeps the mock, where it doesn't exist, looking the same as Zebar. The line height of 1.15 that it set is kept in `src/app.css`.

`src/app.css` also applies a global transition to color-like properties on `*`. Sizes derive from `--font-size`, so scaling the bar means raising the font size and the height in `zpack.json` together.

## GlazeWM integration

GlazeWM is reached through the `glazewm` provider, whose `runCommand` issues WM commands. It is optional at runtime: `providers.glazewm` stays `null` without it.

Click-through relies on a GlazeWM binding mode. A keybinding enables and immediately disables a mode named `ct`, and `binding_modes.svelte.ts` treats each activation as one toggle of its own state, throttled so that the instance on each monitor stays in step. The reason is explained in a comment in that file: binding modes don't inherit the default keybindings, so staying in the mode isn't an option.

## Privileged actions

`zebar.shellExec` only runs what `privileges.shellCommands` in `zpack.json` allows, so each new command needs a rule there, in `static/zpack.json` and in `dev_static/zpack.json` to work in dev builds. Rules belong to a widget, so the bar and the `flyout` widget carry the same list. Tauri window calls are limited by the permissions Zebar ships.

## Builds

- `pnpm dev` runs `vite build --watch` in the `dev` mode. `vite.config.ts` wraps the adapter in that mode, so each build ends by copying `dev_static/` over `build/`. A developer's personal configuration ends up there, and anything missing from it keeps the `static/` version. `dev_static/` is created from `static/` on first use and isn't refreshed after that.
- The last step of a `dev` build writes `dev-build.txt`. `src/lib/dev_reload.ts`, which only exists in that mode, polls the file and reloads the page when it changes. Being a file in the pack, it needs no server, port or CORS.
- `pnpm dev:once` runs the same build once.
- `scripts/build.js` (`pnpm build`) builds, then copies `README.md` and `LICENSE` into `build/`, because `zebar publish` only packs them from the root of the pack. Marketplace preview images are small copies in `static/preview/`. The full-size screenshots stay in `misc/`, outside the package, and the README links to them on GitHub.
- `pnpm dev:mock` runs the Vite dev server in the `mock` mode, where `vite.config.ts` aliases `zebar` to `src/lib/mock/zebar.ts`. The real package throws outside Zebar, so this is what lets the UI run in a browser. Its data is fixed, widgets open as browser windows, which share storage and `BroadcastChannel` with the bar as real ones do, and it's never part of a build.

## CI and releases

- `ci.yml` runs `pnpm lint`, `pnpm check`, actionlint, zizmor and the build on pushes to `main` and on pull requests. The build is `build.yml`, a reusable workflow, so CI, `release.yml` and `publish-marketplace.yml` all build the same way. The composite action in `.github/actions/setup` installs pnpm, Node and the locked dependencies.
- `publish-rehearsal.yml` runs on pull requests that touch packaging, or by hand. It runs `scripts/publish.sh`, the same script as a real publish, against `scripts/publish_stub.ts`, a local stand-in that checks the form fields and the tarball. Nothing reaches the marketplace, and the marketplace's own validation isn't covered.
- `release.yml` is started by hand. It builds, zips `build/` and creates a GitHub release with `gh release create`.
- `publish-marketplace.yml` runs when a release is published, building its tag, or by hand, building the ref it's started on. `.github/actions/zebar-cli` installs a pinned Zebar build, and `scripts/publish.sh` runs `zebar publish` with `ZEBAR_PUBLISH_TOKEN`, passing the version from the tag.

The steps are in `.claude/skills/release/SKILL.md`.
