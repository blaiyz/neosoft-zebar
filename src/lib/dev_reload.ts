const POLL_INTERVAL_MS = 500;

/**
 * Reloads the widget whenever `pnpm dev` finishes a build, by watching the
 * marker file that build writes. `vite.config.ts` explains the marker. A failed
 * read is normal, as `build/` is empty while a build is being written.
 */
export function reloadOnRebuild() {
  let currentBuild: string | null = null;

  setInterval(() => {
    fetch("dev-build.txt", { cache: "no-store" })
      .then((response) => (response.ok ? response.text() : null))
      .then((build) => {
        if (build === null) return;
        if (currentBuild !== null && build !== currentBuild) {
          location.reload();
        }
        currentBuild = build;
      })
      .catch(() => null);
  }, POLL_INTERVAL_MS);
}
