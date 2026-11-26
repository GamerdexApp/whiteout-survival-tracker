import type { PlanId } from "./planOverview";

const KEY = "whiteout-survival-tracker-plan-overview";

/** The plans that a chief turned off in the overview, kept on this device and never synced. */
type SwitchedOff = Record<string, PlanId[]>;

const empty: SwitchedOff = {};
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: SwitchedOff = empty;

export const planOverviewState = {
  load(): SwitchedOff {
    if (typeof window === "undefined") return empty;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === cachedRaw) return cached;
      cachedRaw = raw;
      cached = raw ? (JSON.parse(raw) as SwitchedOff) : empty;
      return cached;
    } catch {
      return cached;
    }
  },

  loadOnServer(): SwitchedOff {
    return empty;
  },

  setOff(chiefId: string, plans: PlanId[]) {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ ...planOverviewState.load(), [chiefId]: plans }),
      );
    } catch {
      return;
    }
    listeners.forEach((listener) => listener());
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  },
};
