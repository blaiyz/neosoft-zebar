---
name: add-config
description: Add, rename or remove a user-facing setting - an option in the settings document or a theme variable - across the schema, migrations, Tailwind, presets, README and dev setup. Use whenever a change introduces or alters something users configure.
argument-hint: "[setting and what it controls]"
---

# Add a setting

Setting: $ARGUMENTS

A setting lives in several places, and missing one usually fails silently.

## An option in the settings document

- [ ] Add the field with its default to the schema in `src/lib/config_schema.ts`, in the object it belongs to. `.describe()` becomes the editor hint users see, so describe each value. Write it for users.
- [ ] Run `pnpm schema`. Don't add the key to `static/config.json`: it stays empty, because anything in it is imported over the user's settings.
- [ ] Mention the option in the README if users need to know about it. The schema's hints cover the rest, so the README doesn't list every key.
- [ ] Read it through the `config` object. It holds the defaults until `configStatus.loaded`, and it can change at any time, so read it in a template, `$derived` or `$effect`, never once. If an effect shouldn't run on the defaults, check `configStatus.loaded` (see `src/lib/state/binding_modes.svelte.ts`).
- [ ] A new section: add it to `src/lib/sections.ts`, in `partSides` and at the point in `collapseSteps` where it should give way as well, and to `src/lib/components/section_components.ts`, and its provider to `src/lib/state/providers.svelte.ts`, which starts it unless the section is `false`.

Stored documents won't have the new key, so its default applies to them. The default has to preserve today's behavior unless the change is meant to alter it. Every key needs a default, and that is what keeps partial documents valid.

Renaming or removing a key: stored documents still carry the old key, and the schema drops unknown keys without rejecting them, so the user's setting would be lost without warning.

- [ ] Raise `CONFIG_VERSION` and add a step to `MIGRATIONS` in `src/lib/config_migrations.ts`. Steps run in order, and keys already in the new format have to pass through them.
- [ ] Use a throwaway script to run the step over a realistic old document, including `dev_static/config.json`.

## A theme variable

- [ ] Add it to the `:root` block of `src/themes/presets.css` if it isn't a color, and prefer values relative to `--font-size`, so scaling the bar keeps working.
- [ ] Colors: raw HSL triplets without commas. Add it to **every** `[data-theme]` block in `src/themes/presets.css`, using a suitable color from that palette. A preset that misses it renders nothing.
- [ ] Expose a color in the `@theme` block of `src/app.css` as `--color-zb-<name>: hsl(var(--name));`.
- [ ] Classes chosen at runtime go in a lookup table of complete names, because Tailwind only generates what it finds written out in full.

A new preset also needs a name in `themePresets` in `src/lib/config_schema.ts` and a row in the README's table.

## Dev setup

`pnpm dev` copies `dev_static/` over the build, and that folder is created once and never refreshed:

- [ ] Copy `static/schema.json` over `dev_static/schema.json`. The schema is generated, so this replaces nothing of the owner's.
- [ ] Add the new key to `dev_static/config.json` only if a change needs it to differ from the default, without touching anything else in the file, and tell the owner you did.

## Check

- [ ] Continue with `/change` from step 4. Config changes are the risky tier.
- [ ] `grep -rn` the name of a sibling setting in `README.md`, `docs/` and `.claude/`, and add the new one wherever its siblings appear.
- [ ] For the owner to try: the bar with the option set, unset, and set to an invalid value.
