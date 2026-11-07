/**
 * Runs `run` at most once every `wait` milliseconds, always ending with the last
 * arguments it was given. `flush()` runs anything still waiting at once.
 */
export function throttle<Args extends unknown[]>(
  run: (...args: Args) => void,
  wait: number
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let last = -Infinity;
  let pending: Args | null = null;

  const fire = () => {
    clearTimeout(timer);
    timer = undefined;
    if (!pending) return;

    const args = pending;
    pending = null;
    last = performance.now();
    run(...args);
  };

  const call = (...args: Args) => {
    pending = args;
    timer ??= setTimeout(fire, Math.max(0, last + wait - performance.now()));
  };
  call.flush = fire;

  return call;
}
