---
name: add-config
description: Add, rename or remove a user-facing setting - a config.json option or a config.css variable - across the interface, schema, defaults, Tailwind, README and dev setup. Use whenever a change introduces or alters something users configure.
argument-hint: "[setting and what it controls]"
---

# Add a setting

Setting: $ARGUMENTS

A setting lives in several places, and missing one usually fails silently.

## A config.json option

- [ ] Add the field with its default to the schema in `src/lib/config_schema.ts`, in the object it belongs to. `.describe()` becomes the editor hint users see, so describe each value. Write it for users.
- [ ] Add the same default to `static/config.json`, the template users edit. `pnpm check` fails if the two differ.
- [ ] Run `pnpm schema`. An invalid user file logs an error and leaves the bar on its defaults.
- [ ] Add the option to the default configuration block in `README.md`.
- [ ] Read it through the `config` object. It is reactive, and starts as the defaults until the user's file has loaded, so anything needing the final value once awaits `configLoaded` instead (see `src/lib/state/binding_modes.svelte.ts`).

Existing users' files won't have the new key, so its default has to preserve today's behavior unless the change is meant to alter it. Every key needs a default, and that is what keeps old files valid.

Renaming or removing a key: old files still carry the old key. The schema drops unknown keys without rejecting them, so the user's setting is lost without warning. Mention that in the release notes.

## A config.css variable

- [ ] Add it to `static/config.css` with a sensible default.
- [ ] Colors: raw HSL triplets without commas. Map the semantic name to a palette variable from `src/themes/`. Expose it in the `@theme` block of `src/app.css` as `--color-zb-<name>: hsl(var(--name));`.
- [ ] Sizes: prefer values relative to `--font-size`, so scaling the bar keeps working.
- [ ] Classes chosen at runtime go in a lookup table of complete names, because Tailwind only generates what it finds written out in full.
- [ ] Add the variable to every matching theme preset in `README.md`, using a suitable color from each palette.

A user keeping an older `config.css` won't define the variable. Give it a fallback where the bar would otherwise look broken, for example `var(--name, var(--text))`.

## Dev setup

`pnpm dev` copies `dev_static/` over the build, and that folder is created once and never refreshed, so a new option doesn't exist there until it's added:

- [ ] Copy `static/schema.json` over `dev_static/schema.json`. The schema is generated, so this replaces nothing of the owner's.
- [ ] Add the new key to `dev_static/config.json` or the new variable to `dev_static/config.css`, without touching anything else in those files, and tell the owner you did.

## Check

- [ ] Continue with `/change` from step 4. Config changes are the risky tier.
- [ ] `grep -rn` the name of a sibling setting in `README.md`, `docs/` and `.claude/`, and add the new one wherever its siblings appear.
- [ ] For the owner to try: the bar with the option set, unset, and set to an invalid value.
