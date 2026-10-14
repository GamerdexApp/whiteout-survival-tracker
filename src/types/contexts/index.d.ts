import type { Playthrough, Settings } from "@/types/app";

export interface PlaythroughContextType {
  playthroughs: Playthrough[];
  activePlaythrough: Playthrough | null;
  settings: Settings;
  isLoaded: boolean;
  lastSavedAt: Date | null;
  setActivePlaythrough: (id: string | null) => void;
  updateSettings: (updates: Partial<Settings>) => void;
}

export interface UIContextType {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}
