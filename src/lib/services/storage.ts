import type { AppData } from "@/types/app";

export const STORAGE_KEY = "whiteout-survival-tracker";

const emptyData: AppData = {
  playthroughs: [],
  activePlaythroughId: null,
};

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedData: AppData = emptyData;

const notifyListeners = () => listeners.forEach((listener) => listener());

export const storageService = {
  /**
   * Returns the same object until the stored text changes, as `useSyncExternalStore` requires.
   */
  load(): AppData {
    if (typeof window === "undefined") return emptyData;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === cachedRaw) return cachedData;

      const parsed = raw ? (JSON.parse(raw) as AppData) : emptyData;
      cachedRaw = raw;
      cachedData = Array.isArray(parsed.playthroughs) ? parsed : emptyData;
      return cachedData;
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      return emptyData;
    }
  },

  loadOnServer(): AppData {
    return emptyData;
  },

  save(data: AppData): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      notifyListeners();
      return true;
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
      return false;
    }
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
