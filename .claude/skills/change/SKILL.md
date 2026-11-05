---
name: change
description: The workflow for any fix, feature, tweak or refactor in this repo, from the owner's request to a ready-to-paste commit message. Use whenever the owner asks to fix, add, change, improve or remove something in the widget.
argument-hint: "[what to change]"
---

# Make a change

Request: $ARGUMENTS

## 1. Understand

- If this is a new session: read `notes/HANDOFF.md` and `notes/CONTEXT.md`, and skim `docs/architecture.md`.
- Read the components and modules involved before proposing anything.
- Ask the owner when the request leaves a real choice open (behavior, look, a trade-off). Don't guess. For a choice between libraries or designs, research first (sources and dates) and propose.
- Verify every API against the version in `pnpm-lock.yaml` (`node_modules`, version-matched docs, upstream source) before using it. Zebar and Tauri capabilities are a common trap: check what a widget is permitted to do.

## 2. Pick the test tier (say which, in the hand-off)

- **Risky:** `zpack.json` privileges, config loading or schema, provider wiring, the autotiler, CI workflows, dependency bumps.
- **Code:** anything else that changes what ships.
- **Docs only:** no build.

## 3. Make it

- Follow the style of the neighbouring files. Use runes for all new Svelte code.
- A new `config.json` option or `config.css` variable: use `/add-config`.
- Anything needing a shell command: add a narrow rule to `privileges.shellCommands` in `static/zpack.json`.
- Code reaching Zebar, Tauri or `window` goes in `onMount` or `$effect`, because pages are prerendered.
- Follow the writing rules in `CLAUDE.md` ("This repo is public"): comments describe the code as it stands.

## 4. Check

```sh
pnpm format       # or prettier --write on the changed files
pnpm lint
pnpm check
pnpm dev          # confirms it compiles; never pnpm build for this
```

- Docs only: `pnpm exec prettier --check <files>`.
- Think through what a build can't show: a second monitor, GlazeWM stopped, the time before the first provider output, a partial or invalid user `config.json`.

## 5. Hand off

- If the owner asked for a review loop with the request: `/review-loop [level]` now, after the checks. Not otherwise.
- Update `docs/architecture.md`, the README and anything else that now reads false.
- Give the owner:
  1. What changed and which test tier ran, with the result.
  2. What to try after reloading Zebar, as a short list. Say plainly that the widget itself is untested.
  3. A commit message in the style of `git log`, with a body explaining why when it isn't obvious, and no attribution lines. Nothing gets committed or pushed.
- Note anything left open in `notes/HANDOFF.md` (or run `/handoff` at the end).
