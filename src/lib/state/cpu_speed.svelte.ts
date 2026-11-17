import { shellExec } from "zebar";

/**
 * The processor's rated clock in MHz, as Windows records it at startup. Zebar's CPU
 * provider reports a frequency of 0 on Windows, so this is read from the registry.
 */
export const cpuSpeed = $state<{ baseMhz: number | null }>({ baseMhz: null });

export async function readCpuSpeed() {
  try {
    const { stdout } = await shellExec("reg", [
      "query",
      "HKLM\\HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0",
      "/v",
      "~MHz"
    ]);
    const mhz = /~MHz\s+REG_DWORD\s+0x([0-9a-f]+)/i.exec(stdout)?.[1];

    cpuSpeed.baseMhz = mhz === undefined ? null : parseInt(mhz, 16) || null;
  } catch (error) {
    console.error("Error reading the processor speed:", error);
  }
}
