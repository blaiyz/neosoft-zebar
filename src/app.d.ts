import type { ThemeSnapshot } from "#lib/theme.ts";

// See https://svelte.dev/docs/kit/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  interface Window {
    /** Defined in `src/app.html`, so that it can run before the app has loaded. */
    paintTheme: (snapshot: ThemeSnapshot) => void;
  }
}

export {};
