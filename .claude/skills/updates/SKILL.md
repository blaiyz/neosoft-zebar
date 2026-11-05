---
name: updates
description: Keep dependencies and CI healthy - review Dependabot PRs, fix a red CI run, and move the pack to a new Zebar version. Use for anything about versions, dependency bumps or CI failures.
---

# Updates

## Dependabot PRs

Dependabot opens weekly npm PRs (`.github/dependabot.yml`). The owner merges them.

```sh
gh pr list --author "app/dependabot"
gh pr view <n>
gh pr checks <n>
gh pr diff <n>
```

CI builds, lints and type checks, but it can't exercise the widget. For anything beyond a patch bump:

- Read the release notes or changelog for the jump. Pay attention to `svelte`, `@sveltejs/*`, `zebar`, `glazewm`, `tailwindcss` and `vite`.
- A major Tailwind, SvelteKit or Vite bump is a migration: handle them as a change of their own through `/change`, not as a merge.
- To test locally, the owner checks out the PR branch; then `pnpm install`, `pnpm check`, `pnpm dev`, and the owner reloads Zebar.

Tell the owner: merge, or what blocks it.

## A red CI run

```sh
gh run list -L 5
gh run view <id> --log-failed
```

Find the cause and fix it with `/change`. Workflows are in `.github/workflows/`. Workflow changes are the risky tier, because they only run after the owner pushes.

## Moving to a new Zebar version

Several places follow the Zebar version, and they can drift apart:

- `zebar` in `package.json`, and what `pnpm-lock.yaml` resolves it to: the client library that gets bundled.
- `@tauri-apps/api` in `package.json`: an exact pin matching the version `zebar` depends on. Window objects come from Zebar's copy, so a newer version here adds a second copy to the bundle and its types can stop matching.
- `$schema` in `static/zpack.json`: the pack format.
- The `tag` of the Zebar download in `.github/workflows/publish-marketplace.yml`: the CLI that publishes.

Steps:

1. Read the Zebar release notes from the current version to the target, and check `resources/zpack-schema.json` upstream for format changes.
2. Check that the `zebar` client version still matches what the installed app expects. Users run their own Zebar version, so state any new minimum in the README.
3. Update all of them in one change, and `$schema` in `dev_static/zpack.json` for the owner.
4. Risky tier. The owner tries it on the new app version.
5. Update `docs/research/` with a new dated note if the behavior described there changed. Don't rewrite the old one.
