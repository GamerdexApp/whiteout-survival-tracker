export type Theme = "light" | "dark" | "system";

export type CoreEventId = "svs" | "showdown" | "king" | "hall";

export interface UiSettings {
  furnaceFullLabels?: boolean;
  hideMaxed?: boolean;
  calcUseBonuses?: boolean;
  calcShowSpeedups?: boolean;
  calcShowEventPoints?: boolean;
}

export interface Settings {
  theme?: Theme;
  ui?: UiSettings;
}

export interface BuildingState {
  level?: string | null;
  goal?: string | null;
  built?: boolean;
  instances?: string[];
}

export type Appointment = "none" | "regular" | "supreme";

export interface BuildingPlanGoal {
  current: string | null;
  goal: string;
}

export interface BuildingPlan {
  goals: Record<string, BuildingPlanGoal>;
  vicePresident: Appointment;
  petSkill: boolean;
  chiefOrder: boolean;
  savedAt: string;
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
  buildings?: Record<string, BuildingState>;
  facilities?: Record<string, { built?: boolean }>;
  buildingPlan?: BuildingPlan;
  inventory?: Record<string, number>;
}

export interface AppData {
  playthroughs: Playthrough[];
  activePlaythroughId: string | null;
  settings?: Settings;
}

export interface ChiefValues {
  name: string;
  stateNumber?: number;
  serverStartDate?: string;
  heroGenerationUnlocked: number;
  coreEventsShown: CoreEventId[];
  notes?: string;
}
