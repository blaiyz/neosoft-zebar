---
name: release
description: Prepare a release of the widget pack - check main is ready, choose the version, write the release notes, and walk the owner through the GitHub workflows that publish to the Zebar marketplace. The owner runs every workflow; Claude prepares and checks read-only. Use when the owner wants to release, publish or ship a new version.
argument-hint: "[version]"
---

# Release

Version: $ARGUMENTS

A release is a GitHub release plus a marketplace version, and marketplace users receive it. The owner runs everything that changes state: the version bump commit, the workflows and publishing the release. Claude prepares them and checks the result read-only.

## 1. Is main ready?

```sh
git status
git log --oneline $(git describe --tags --abbrev=0)..origin/main
gh run list --branch main -L 5
```

- Local `main` matches `origin/main`, and the latest CI run is green.
- `pnpm lint` and `pnpm check` pass locally.
- Anything in the range that needs a README update has one.

## 2. Version and notes

- Propose a version from what changed, in line with earlier tags (`gh release list`). The owner picks.
- If `static/zpack.json` doesn't already say this version, the owner bumps it in a commit before releasing. The publish step overrides the version anyway, but the tracked file should match.
- Write release notes for users from the commit range: what's new, what's fixed, and any setting that was renamed, removed or now behaves differently. Use the style of earlier ones (`gh release view <tag>`). Hand them over ready to paste.

## 3. The owner runs the workflows

1. **Actions -> Release -> Run workflow** on `main`, with `version-number` (no `v` prefix), `draft` checked, and `release-notes`. It builds, zips `build/` and creates a draft GitHub release tagged `v<version>`.
2. Check the draft on GitHub, then **publish it**. That fires **Publish to Zebar Marketplace** through the `release: published` event. It builds the tag and runs `zebar publish` with the release notes.
3. If that run fails, fix the cause, then run **Publish to Zebar Marketplace** by hand with `version` set. It needs no new release.

A release created without `draft` is published by `GITHUB_TOKEN`, and GitHub doesn't start workflows from events that token causes, so the marketplace step wouldn't run on its own. Publish the draft by hand instead, or start the marketplace workflow manually.

## 4. Check

```sh
gh run list --workflow publish-marketplace.yml -L 3
gh run view <id> --log-failed     # if it failed
gh release view v<version>
```

Pack names must be lowercase for the marketplace to accept them. The owner confirms the update appears in Zebar's "Browse widgets...".
