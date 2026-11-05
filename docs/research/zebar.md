# How Zebar works

Date: 2026-11-05. Read from `glzr-io/zebar` `main`, five commits ahead of v3.3.1, the latest release at the time (npm `zebar` was also 3.3.1). Paths below are in that repo.

Question: what does a widget pack depend on, and what limits does the host impose?

## The pack format

`resources/zpack-schema.json`, `packages/desktop/src/widget_pack.rs`

- A pack requires `name`, `version` and `widgets`. Optional: `$schema`, `description`, `tags`, `previewImages`, `repositoryUrl`.
- A widget requires `name`, `htmlPath` (relative), `zOrder` (`top_most`, `normal`, `bottom_most`), `shownInTaskbar`, `focused`, `resizable`, `transparent` and `presets`. Optional: `includeFiles`, `caching` (seconds, default 604800), `privileges.shellCommands`.
- A preset has `name`, `anchor`, `offsetX`, `offsetY`, `width`, `height`, `monitorSelection` (`all`, `primary`, `secondary`, `index`, `name`) and an optional `dockToEdge`.
- `includeFiles` is a glob allowlist, unioned across the pack. If it is empty, nothing is served, not even the HTML (`asset_server.rs`, `common/glob_util.rs`).

## Where packs live and how they load

`marketplace_installer.rs`, `app_settings.rs`, `widget_factory.rs`, `sys_tray.rs`

- Custom packs: `~/.glzr/zebar/*/zpack.json`, one level deep.
- Marketplace packs: `%AppData%/zebar/downloads/<id>@<version>`, with metadata in `~/.glzr/zebar/.marketplace/<id>.json`.
- The upstream README says a pack's ID comes from its directory, but the code uses `name`.
- Each widget is a Tauri window that opens `http://127.0.0.1:6124/__zebar/init`, which sets a token cookie and redirects to the HTML. A Rocket server serves the pack directory.
- There is no file watcher. The upstream Solid template's `dev` script is `vite build --watch`, with no hot reload. The tray's "Empty cache & reload configs" clears the cache and relaunches all widgets.

## The client library

`packages/client-api/src/`

- Exports include `createProvider`, `createProviderGroup`, `currentWidget`, `startWidget`, `startWidgetPreset`, `shellExec` and `shellSpawn`.
- A provider group offers `outputMap`, `errorMap`, `onOutput`, `onError`, `restartAll` and `stopAll`.
- Providers: audio, battery, cpu, date, disk, glazewm, host, ip, keyboard, komorebi, media, memory, network, systray, weather.
- `currentWidget()` gives `id`, `name`, `packId`, `htmlPath`, `tauriWindow`, `isPreview`, `setZOrder()` and `close()`. `.window` is deprecated. It throws outside Zebar, since nothing writes its `sessionStorage` fallback.

## Webview limits

- Serving is static only, so there is no server-side rendering, and missing files get no single-page-app fallback.
- The origin root is the pack directory, so root-absolute URLs resolve there. The upstream template uses `base: './'`.
- Storage is shared per pack. The service worker caches cross-origin GET requests only.

## Publishing

`MARKETPLACE.md`, `cli.rs`, `publish.rs`

- `zebar publish --token <token>`, or set `ZEBAR_PUBLISH_TOKEN`. Tokens come from glzr.io/api-token.
- Optional: `--pack-config`, `--version-override`, `--commit-sha`, `--release-notes`, `--release-url`.
- The tarball holds `zpack.json`, `previewImages`, the root readme and license, and `includeFiles` matches, so build first. It is posted to `api.glzr.io/v1/trpc/widgetPack.publishVersion`.

## Open questions

- Whether the CSP in `tauri.conf.json` applies to widget pages. Probably not, but this is inferred.
- Marketplace validation happens server-side and isn't in this repo. This pack's own history suggests names must be lowercase.
- Zebar has no SvelteKit template, so the fit with SvelteKit's static output is observed from this pack rather than documented upstream.
