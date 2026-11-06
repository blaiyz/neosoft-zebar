import { shellExec } from "zebar";

/**
 * Windows' regional format. A webview only knows the display language, which can be
 * from a different region than the one that decides where a week starts.
 */
export const region = $state<{
  locale: string | null;
  /** The first day of the week, with Sunday as 0. */
  firstDay: number | null;
}>({ locale: null, firstDay: null });

export async function readRegion() {
  try {
    const { stdout } = await shellExec("reg", [
      "query",
      "HKCU\\Control Panel\\International"
    ]);
    const locale = /LocaleName\s+REG_SZ\s+(\S+)/.exec(stdout)?.[1];
    const firstDay = /iFirstDayOfWeek\s+REG_SZ\s+(\d)/.exec(stdout)?.[1];

    region.locale = locale ?? null;
    // Windows counts from Monday.
    region.firstDay =
      firstDay === undefined ? null : (Number(firstDay) + 1) % 7;
  } catch (error) {
    console.error("Error reading the regional format:", error);
  }
}
