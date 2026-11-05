---
name: handoff
description: End-of-session wrap-up - update notes/HANDOFF.md and notes/ROADMAP.md with what's true now, record research, and give the owner the commit message for what's uncommitted. Use when the owner says they're done for now, before a long break, or when the context is getting full.
disable-model-invocation: true
---

# Hand off

Chat history doesn't carry over; the next session knows only what's in files.

1. **What changed:** `git status` and `git diff --stat` (tracked), plus the notes touched this session (`notes/` is gitignored, so `git status` doesn't show it).
2. **`notes/HANDOFF.md`:** overwrite the sections that changed so they say what's true now: where things stand (what's committed, what's pending, what's released), next steps in order, open items, new facts about the machine setup. Move history that's no longer needed to `notes/archive/`. Keep it short enough to read in a minute or two.
3. **`notes/ROADMAP.md`:** tick what's done (with the date), add new work the owner asked for.
4. **Research:** public-safe findings go in `docs/research/<topic>.md` with sources and dates; anything else in `notes/`.
5. **Docs:** `docs/architecture.md` and the README match the code.
6. **Commit message:** for whatever is uncommitted, ready to paste, in the style of `git log`, with no attribution lines. Say if `CLAUDE.md` changed. Don't commit or push.
7. **Memory:** save to Claude's memory only feedback or preferences that hold beyond this repo's files (the files are the main record).
8. Tell the owner in a few lines: what's done, what's pending on them, what the next session starts with.
