export type FitSide = "left" | "right";

export type FitStep<Part extends string> = {
  part: Part;
  side: FitSide | "center";
  /** The width of the part once this step applies. */
  to: number;
  /** Whether it can stop anywhere above `to`, using only the space it must. */
  partial?: boolean;
  /**
   * Goes only if all the other steps together can't make room for it, and then
   * nothing else gives way on its account.
   */
  last?: boolean;
};

export type FitInput<Part extends string> = {
  /** In the order to apply them. Pinned parts aren't in here. */
  steps: FitStep<Part>[];
  /** The width of each part at its widest. */
  widths: Partial<Record<Part, number>>;
  /** What each side needs with everything at its widest. */
  needed: Record<FitSide, number>;
  /** What each side can have with everything at its widest. */
  capacity: Record<FitSide, number>;
};

type Overflow = Record<FitSide, number>;

// The middle group is centred, so each side gets half of what it gives up.
const sidesOf = (side: FitStep<string>["side"]): FitSide[] =>
  side === "center" ? ["left", "right"] : [side];

function walk<Part extends string>(
  steps: FitStep<Part>[],
  widths: FitInput<Part>["widths"],
  start: Overflow,
  given: Partial<Record<Part, number>>
) {
  const overflow = { ...start };
  const targets = { ...given };

  for (const { part, side, to, partial } of steps) {
    const current = targets[part] ?? widths[part] ?? 0;
    const available = current - to;
    if (available <= 0) continue;

    const sides = sidesOf(side);
    const share = 1 / sides.length;

    const worst = Math.max(...sides.map((name) => overflow[name]));
    if (worst <= 0) continue;

    const saved = partial ? Math.min(available, worst / share) : available;
    targets[part] = current - saved;
    for (const name of sides) overflow[name] -= saved * share;
  }

  return { targets, overflow };
}

/**
 * Works out the width of every part that has to give way, walking the steps in
 * order and taking only those that help a side that doesn't fit. It starts from
 * nothing each time, so the result only depends on the widths given. Anything left
 * out of the result stays at its widest.
 */
export function fit<Part extends string>({
  steps,
  widths,
  needed,
  capacity
}: FitInput<Part>) {
  const regular = steps.filter((step) => !step.last);
  const overflow = {
    left: needed.left - capacity.left,
    right: needed.right - capacity.right
  };
  const given: Partial<Record<Part, number>> = {};

  let result = walk(regular, widths, overflow, given);

  for (const { part, side, to, last } of steps) {
    if (!last) continue;

    const sides = sidesOf(side);
    if (sides.every((name) => result.overflow[name] <= 0)) continue;

    const saved = (widths[part] ?? 0) - to;
    if (saved <= 0) continue;

    given[part] = to;
    for (const name of sides) overflow[name] -= saved / sides.length;
    result = walk(regular, widths, overflow, given);
  }

  return result.targets;
}
