import type { StoredTokens, SyncState } from "@gamerdexapp/gamerdex-sync";
import { STORAGE_KEY } from "@/service/storage";

export const SYNC_APP_ID = "whiteout-survival-tracker";

const DEVICE_KEY = `${STORAGE_KEY}:sync`;

/**
 * What this device keeps about syncing. It lives outside the saved data and is never uploaded: the
 * login, the repository, and the cloud copy as last seen.
 */
export interface DeviceSync {
  deviceId: string;
  deviceName: string;
  tokens: StoredTokens | null;
  repository: string | null;
  state: SyncState | null;
  signInState: string | null;
  lastSyncAt: string | null;
}

const serverDevice: DeviceSync = {
  deviceId: "",
  deviceName: "",
  tokens: null,
  repository: null,
  state: null,
  signInState: null,
  lastSyncAt: null,
};

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: DeviceSync = serverDevice;

const platformName = () => {
  const agent = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  return agent.userAgentData?.platform || navigator.platform || "Browser";
};

const freshDevice = (): DeviceSync => ({
  ...serverDevice,
  deviceId: crypto.randomUUID(),
  deviceName: platformName(),
});

export const deviceStore = {
  load(): DeviceSync {
    if (typeof window === "undefined") return serverDevice;
    try {
      const raw = localStorage.getItem(DEVICE_KEY);
      if (raw === cachedRaw) return cached;
      cachedRaw = raw;
      cached = raw
        ? { ...serverDevice, ...(JSON.parse(raw) as Partial<DeviceSync>) }
        : freshDevice();
      return cached;
    } catch {
      return cached === serverDevice ? freshDevice() : cached;
    }
  },

  loadOnServer(): DeviceSync {
    return serverDevice;
  },

  update(changes: Partial<DeviceSync>): boolean {
    const next = { ...deviceStore.load(), ...changes };
    try {
      localStorage.setItem(DEVICE_KEY, JSON.stringify(next));
    } catch {
      return false;
    }
    listeners.forEach((listener) => listener());
    return true;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  },
};
