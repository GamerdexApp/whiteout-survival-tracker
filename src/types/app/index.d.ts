export type Theme = "light" | "dark" | "system";

export type CoreEventId = "svs" | "showdown" | "king" | "hall";

export interface Settings {
  theme?: Theme;
}

export interface Playthrough {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  stateNumber?: number;
  serverStartDate?: string;
  heroGenerationUnlocked: number;
  coreEventsShown?: CoreEventId[];
  notes?: string;
}

export interface AppData {
  playthroughs: Playthrough[];
  activePlaythroughId: string | null;
  settings?: Settings;
}
