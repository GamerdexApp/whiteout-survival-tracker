import type { AppData, Playthrough, Settings } from "@/types/app";

export interface PlaythroughContextType {
  appData: AppData;
  playthroughs: Playthrough[];
  activePlaythrough: Playthrough | null;
  settings: Settings;
  isLoaded: boolean;
  lastSavedAt: Date | null;
  saveFailed: boolean;
  /**
   * Saves the result of `update` and returns the data as it was before, so a caller can offer Undo.
   * It returns null when the browser could not store the data. The Not saved toast is already
   * shown then, so the caller stops and shows no success message.
   */
  updateData: (update: (current: AppData) => AppData) => AppData | null;
  setActivePlaythrough: (id: string | null) => void;
  updateSettings: (updates: Partial<Settings>) => void;
}

export interface UIContextType {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}
