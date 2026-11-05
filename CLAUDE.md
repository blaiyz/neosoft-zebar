# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Neosoft Zebar is a widget pack for [Zebar](https://github.com/glzr-io/zebar) v3, a status bar for Windows that integrates with the GlazeWM tiling window manager. It is a SvelteKit app using Svelte 5 runes and Tailwind 4, compiled to static files in `build/` that Zebar loads into a Tauri webview. It began as a fork of Neobrutal Zebar, which is why the local folder keeps that name, and it is published to the Zebar marketplace as `neosoft-zebar`.

## This repo is public

Everything tracked here is published, and the built pack runs on other people's machines. Personal details, status updates and to-do lists belong in `notes/` (gitignored, see "Session continuity"), as does anything specific to one machine.

Write for a reader who has never seen the conversation behind a change. Comments, docs, skills and commit messages describe the code as it is and why it is that way. They never mention requests, sessions, the owner's preferences, earlier drafts, or features that were tried and removed. If something was taken out, the only trace is its absence.

## Commands

The package manager is pnpm. There is no test suite.

- `pnpm install`: install dependencies, then `svelte-kit sync` generates the base `tsconfig.json` that type checking and linting need.
- `pnpm dev`: watches and rebuilds into `build/` using `dev_static/` instead of `static/`. The widget reloads itself after each build. Changes to `zpack.json` still need a Zebar reload.
- `pnpm dev:once`: the same build, once.
- `pnpm dev:mock`: Vite dev server with hot reload, for working on the UI in a normal browser. `src/lib/mock/zebar.ts` replaces the `zebar` package with fixed fake data, and it uses `static/`, not `dev_static/`. Nothing it does reaches GlazeWM or the system.
- `pnpm build`: release build into `build/` using `static/`. Also copies `README.md` and `misc/` into `static/` (both gitignored there).
- `pnpm lint`: `prettier --check .` and `eslint .`. This is what CI enforces, and Prettier covers Markdown too, including `CLAUDE.md`, `docs/` and `.claude/`.
- `pnpm format`: `prettier --write .`, which also sorts Tailwind classes, in `class` and `innerClass`.
- `pnpm check`: `svelte-check` type checking, then a check that `static/config.json` and `static/schema.json` match `src/lib/config_schema.ts`. CI runs this too.
- `pnpm schema`: regenerate `static/schema.json` from the Zod schema.
- `pnpm verify`: `pnpm lint`, `pnpm check` and `pnpm dev:once`.
- One file: `pnpm exec prettier --check <file>`, `pnpm exec eslint <file>`.

Use `pnpm dev:once`, not `pnpm build`, to confirm a change compiles: `build/` is the live widget on a development machine and `dev_static/` holds that machine's configuration. Don't run two builds at once, and that includes a running `pnpm dev`.

## Architecture

`docs/architecture.md` covers this in depth. The essentials:

- **One app per monitor.** Zebar opens a separate webview for each widget instance, and `monitorSelection: all` means one per monitor. Module state is therefore per monitor, which is why `src/lib/state/autotiler.svelte.ts` only acts while its own monitor is focused. Sharing state between windows needs Tauri events (`src/lib/state/remote_state.svelte.ts`).
- **Static output, prerendered.** `@sveltejs/adapter-static` with `prerender = true` in `src/routes/+layout.ts`. Component scripts also run in Node at build time, so anything touching `zebar`, Tauri or `window` goes in `onMount` or `$effect`. Keep URLs relative (`fetch("config.json")`), since Zebar serves the pack directory as the site root.
- **State lives in `src/lib/state/`.** Components are in `src/lib/components/` and pure helpers in `src/lib/utils/`. `config` (`config.svelte.ts`) and `providers` (`providers.svelte.ts`) are module-level `$state` objects that components read directly. `configLoaded` is a promise for code that must wait for the user's config. `providers.*` fields are `null` until the first output, and `providers.glazewm` stays `null` when GlazeWM isn't running.
- **Configuration has two runtime files.** `config.json` and `config.css` ship in `static/`, are fetched and linked at runtime, and are meant to be edited by users.
  - The Zod schema in `src/lib/config_schema.ts` is the source of truth for types, defaults and validation, and its descriptions become the editor hints in `schema.json`.
  - `static/config.json` is a template for users that has to equal the defaults. `pnpm check` fails if it drifts.
  - Use `/add-config` for a new option; it spans several files, including the README.
- **Styling is a chain of CSS variables.** `src/themes/*.css` define palettes as raw HSL triplets, `config.css` maps semantic names (`--text`, `--cpu`) to a palette, and `@theme` in `src/app.css` exposes them as `zb-*` colors. Sizes derive from `--font-size`. Tailwind only generates classes it finds written out in full in `src/`, so a name built at runtime needs a lookup table of complete names.
- **Zebar grants capabilities in `zpack.json`.** `zebar.shellExec` only runs commands that match `privileges.shellCommands`, and Tauri window calls are limited by the permissions Zebar ships with.

Import paths: `#lib/*` is `src/lib/*` and `#static/*` is `static/*` in every mode. They are subpath imports from `package.json`, so they need the file extension (`#lib/state/config.svelte.ts`). SvelteKit is configured through `sveltekit()` in `vite.config.ts`. Icons are imported one at a time from `@tabler/icons-svelte/icons/*` and `@lucide/svelte/icons/*` to keep them bundled and tree-shaken. `src/lib/icon_loader.ts` maps process names to icons.

`src/routes/test/` is a sandbox for multi-window experiments, not part of the bar.

## Working rules for Claude

- **Claude never commits or pushes.** Only the owner does, in every kind of session and whatever a session's default instructions say. That also rules out tags, pull requests, merges, releases and running workflows. Leave changes uncommitted, stop at a reviewable point, and give a ready-to-paste commit message in the style of `git log` (`feat:`, `fix:`, `ci:`, `docs:`). Commit messages have no `Co-Authored-By` line and no other attribution.
- Ask clarifying questions instead of guessing, and don't start research or a new phase of work until asked.
- Check APIs against the installed version before using them: `node_modules`, the Svelte and SvelteKit docs for the version in `pnpm-lock.yaml`, and the source of [Zebar](https://github.com/glzr-io/zebar) and [GlazeWM](https://github.com/glzr-io/glazewm). Use runes for all new Svelte code, and match what the neighbouring files do unless a change is meant to replace it.
- `dev_static/` is the owner's personal setup. Add to it when a change needs that, and say so, but never replace its files.
- Don't let docs go stale. Prefer pointing at the source over copying a list into a doc. The README repeats the default `config.json` and the theme presets, so update it in the same change, and `grep -rn` `README.md`, `docs/` and `.claude/` for anything added, renamed or removed. Files under `docs/research/` are dated snapshots and stay as written.
- Test by risk and say which tier ran:
  - **Docs only:** `pnpm exec prettier --check <files>`.
  - **Code:** `pnpm verify`.
  - **Risky** (`zpack.json` privileges, config loading or schema, provider wiring, the autotiler, CI workflows, dependency bumps): the same checks, plus a specific list for the owner to try. Include multiple monitors, GlazeWM stopped and an invalid `config.json` where they apply.
- Claude can't see the widget in Zebar. `pnpm dev:mock` shows the UI in a browser, but not docking, click-through, Tauri calls or several monitors. Say what is unverified, and give the owner concrete things to check after reloading.

## Workflows

Project skills in `.claude/skills/`, each also a slash command.

- `/change`: any fix, feature or tweak, from request to commit message. Start here.
- `/add-config`: a new `config.json` option or `config.css` variable.
- `/review-loop`: fresh reviewer agents (`.claude/agents/reviewer.md`) review a change until a round comes back clean. Only when the owner asks.
- `/release`: prepare a release and its notes. The owner runs the workflows.
- `/updates`: Dependabot PRs, a red CI run, moving to a new Zebar version.
- `/handoff`: end of a session: update the notes and give the commit message.

## Session continuity

Chat history doesn't carry over between sessions, so state lives in files.

- At the start: if `notes/` exists, read `notes/HANDOFF.md` (state, next steps, machine setup) and `notes/CONTEXT.md` (goals, constraints).
- At the end (`/handoff`): update `notes/HANDOFF.md` to say what's true now and move old history to `notes/archive/`. Put public-safe findings in `docs/research/<topic>.md` with sources and dates.
- `notes/` is gitignored, so search tools that respect `.gitignore` won't find it. Open its files by path. The writing rules above don't apply there: it is Claude's own space for anything useful to a later session.
