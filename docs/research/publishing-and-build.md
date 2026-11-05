# Publishing and build behaviour

Date: 2026-11-05. Read from `glzr-io/zebar` v3.1.1 (the CLI this pack publishes with) and v3.3.1, and from `@sveltejs/kit` 3.1.0. Paths under `packages/desktop/` are in the Zebar repository.

Question: what does `zebar publish` really need and do, and which limits in Zebar and SvelteKit aren't documented?

## `zebar publish`

`packages/desktop/src/publish.rs`, `cli.rs` and `main.rs` at v3.1.1

- There is a hidden `--api-url` flag, default `https://api.glzr.io`, which is what makes a local rehearsal possible.
- The CLI posts a multipart form to `<api-url>/v1/trpc/widgetPack.publishVersion`, with the token in `X-API-TOKEN`. The fields are `packConfig` and `tarball` (files), and `versionOverride`, `commitSha`, `releaseNotes` and `releaseUrl` (text).
- A success reply is `{ result: { data: { json: { widgetPack: { publishedId, latestVersion } } } } }`. A failure is `{ error: { json: { message } } }`.
- Exit codes: 0 on success, 1 on an error from the CLI or the server, 2 on a command line it can't parse.
- `previewImages` go through `canonicalize`, then `strip_prefix` against the pack directory. An image must therefore be a local file inside the pack, so a URL can't be used.
- The readme and license are matched case-insensitively, but only in the root of the pack.
- The command runs inside Tauri's `setup` callback, so on Linux it needs a display even though it opens no window. CI starts Xvfb for it.
- It exits before the single-instance plugin is registered, so running it leaves a running Zebar alone.
- `--release-notes "- item"` fails with `unexpected argument '- ' found`, because the argument parser reads the value as a flag. `--release-notes="- item"` works. The failure was seen with v3.3.1 on Windows. The `=` form was confirmed on v3.1.1 on Linux.

## Shell privileges

`packages/desktop/src/shell_state.rs` at v3.3.1

- Array arguments are joined with single spaces before the check, so a rule sees `/c start https://...` as one string.
- The check is `Regex::is_match`, which isn't anchored. A rule without `^` and `$` also matches longer commands that contain it.
- An empty `argsRegex` only matches empty arguments.

## Window permissions

`packages/desktop/capabilities/widget.json`

- The permissions behind `setEffects` and `setIgnoreCursorEvents` are in v3.2.0 and not in v3.1.1.

## SvelteKit build workers

`src/core/config/index.js` in `@sveltejs/kit`

- `load_vite_config` calls `vite.resolveConfig` with `process.env.MODE ?? 'production'`. The analyse and prerender workers each use it and don't see `--mode`, so a Kit option set only for a given mode in `vite.config.ts` doesn't reach them.
- Each of those workers loads the Vite config again, which adds to every build.

## Open questions

- The marketplace's rules for preview images aren't public. PNG is known to pass. JPEG was unconfirmed at this date: one public pack lists a JPG preview, but it couldn't be confirmed as published.

## Sources

- [Zebar v3.1.1 `publish.rs`](https://github.com/glzr-io/zebar/blob/v3.1.1/packages/desktop/src/publish.rs)
- [Zebar v3.1.1 `cli.rs`](https://github.com/glzr-io/zebar/blob/v3.1.1/packages/desktop/src/cli.rs)
- [Zebar v3.1.1 `main.rs`](https://github.com/glzr-io/zebar/blob/v3.1.1/packages/desktop/src/main.rs)
- [Zebar v3.3.1 `shell_state.rs`](https://github.com/glzr-io/zebar/blob/v3.3.1/packages/desktop/src/shell_state.rs)
- `widget.json` at [v3.1.1](https://github.com/glzr-io/zebar/blob/v3.1.1/packages/desktop/capabilities/widget.json) and [v3.2.0](https://github.com/glzr-io/zebar/blob/v3.2.0/packages/desktop/capabilities/widget.json)
- [SvelteKit `core/config/index.js`](https://github.com/sveltejs/kit/blob/main/packages/kit/src/core/config/index.js)
