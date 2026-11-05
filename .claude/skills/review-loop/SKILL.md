---
name: review-loop
description: Review a change with fresh reviewer agents that know nothing of this session, fix or dispute each finding, and repeat until a round comes back clean, at an effort level from low to max. Runs only when the owner asks, by name or by asking for a review loop when they request the change. Works on uncommitted changes, a branch or an open PR.
argument-hint: "[auto|low|medium|high|max] [PR number or branch] [--report-only]"
---

# Review loop

Arguments: $ARGUMENTS

The session that wrote a change reviews it badly: it shares the change's blind spots. So reviewers here are fresh agents of the project type `reviewer` (`.claude/agents/reviewer.md`), never forks of this session. This session starts them, sorts their findings, fixes, and decides when the change is ready. The owner still reviews, commits and pushes.

**Start only when the owner asks:** `/review-loop`, or "with a review loop" (and a level, if they give one) in the request for the change; `/change` then runs it after its checks. Never start one on your own judgment.

## 0. Target and level

- **Target:** by default the uncommitted changes (`git diff HEAD`, plus untracked files from `git status`). Or a branch (`main...<branch>`), or a PR number (`gh pr view <n> --json headRefName,title,body`; `gh pr diff <n>`).
- **Brief:** write a short description first: what the change does, what the owner decided and why, the test tier. For a PR, use its title and description. It's the reviewers' only view of the intent; don't give them your reasoning beyond that.
- **Level:** the one given; `auto` (also when none is given) is yours to pick from what's at stake, not from the size of the diff:
  - start from the test tier (`/change` step 2): docs only -> low, code -> medium, risky -> high;
  - go up a level for what the tier misses: a change to `privileges.shellCommands` or to what the pack loads from the network, behavior that relies on how Zebar or Tauri works and that you haven't checked in its source, or a design you weren't sure of;
  - go down a level for a mechanical change in the risky tier (a patch bump, a renamed key);
  - between rounds, go up one level when a round finds a must-fix you didn't see coming (a whole class of problem, not a typo).

  `auto` stops at high: `max` only when the owner names it. Before starting, say the level and the reason in one line; the report repeats it, with any change between rounds.

- **--report-only:** one round, no fixes: give the findings and stop (for code that isn't this session's, or when the owner only wants a review).

## 1. Levels

|                           | low          | medium            | high             | max              |
| ------------------------- | ------------ | ----------------- | ---------------- | ---------------- |
| Finders per round (model) | 1 (sonnet)   | 1 (opus)          | 3 (opus)         | 5 (opus)         |
| Angles                    | diff         | all, in one agent | split in 3       | one or two each  |
| Bias, cap per finder      | precision, 4 | precision, 8      | recall, 6        | recall, 8        |
| Verifier                  | none         | disputes          | disputes         | every finding    |
| Gap sweep                 | no           | no                | no               | yes              |
| Rounds (at most)          | 1            | 2                 | 3                | 4                |
| Later rounds see          | -            | the fixes         | the whole change | the whole change |

- Angle names are in the agent's file. The high split: (diff, removed, callers), (runtime, threat, upstream), (repo, simpler). Max: diff+removed, callers, runtime+threat, upstream, repo+simpler.
- **Precision:** keep only findings a maintainer would act on. **Recall:** surface anything with a nameable failure scenario; the verify step filters.
- **Gap sweep** (max): after verify, one more finder gets the round's list and looks only for what's missing on it.
- **Later rounds:** at medium, round 2 reviews only the fixes against the round 1 findings. At high and max, every round starts new finders on the whole change, because later full passes find what the first missed.
- Start a round's finders in parallel (one message, several Agent calls, `subagent_type: "reviewer"`, `model` from the table).

## 2. The finder brief

Each finder gets, and nothing else:

- its role (finder), its angles, the bias and the cap;
- the target: how to get the diff;
- the description from step 0;
- from round 2: the settled findings, one line each (file:line, what, fixed or refuted and why), and "don't raise these again unless the fix is wrong".

Don't edit files while a round's finders are running; they read the same working tree.

## 3. Sort each finding

Merge duplicates (same place, same mechanism). Then for each:

- **Agree:** fix it. Cleanup findings: fix if cheap, else list them; they never cause another round on their own.
- **Disagree:** a verifier (fresh `reviewer` agent, verifier role; sonnet at medium, opus above) gets the diff, the finding, the finder's evidence and your reply with its evidence, and returns CONFIRMED, PLAUSIBLE or REFUTED. Follow the verdict. If you still think it's wrong, it goes to the owner as disputed, with both sides. Never drop a finding silently. At low there is no verifier: the dispute goes to the owner.
- **The owner's call:** a finding whose fix is a trade-off, or changes how the bar looks or behaves in a way the owner hasn't decided: ask the owner (`AskUserQuestion`) when it blocks the rest; otherwise collect it for the report.
- At max, every finding goes to a verifier before you sort it; drop the REFUTED ones (listed in the report).

## 4. Fix and check

- Fix all accepted findings of the round together, then the cheap checks: `pnpm lint`, `pnpm check`, `pnpm dev`.
- Fixes stay uncommitted, like the rest of the change. Nothing is committed or pushed; if the target is a branch or PR that isn't checked out, report instead of fixing.
- Next round if the round had must-fix or should-fix findings and rounds are left; otherwise stop.

## 5. Report

In the session only. Post nothing to GitHub unless the owner asks.

- the level, rounds run and why it stopped (a clean round, or the round limit, with what's still open);
- a table: round, file:line, severity, finding (short), outcome (fixed, refuted by the verifier and why, disputed, owner's call, cleanup not done);
- the checks run on the final state, and what the owner should try in the widget.

Then continue with `/change` step 5.
