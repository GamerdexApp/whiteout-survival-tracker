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

export interface ResearchPlan {
  goals: Record<string, number>;
  stateBuff: boolean;
  vicePresident: Appointment;
  savedAt: string;
}

export type ResearchQueueId = "main" | "warAcademy";

export interface UpgradeJob {
  startedAt: string;
  endsAt: string;
}

export interface ConstructionJob extends UpgradeJob {
  builder: 1 | 2;
  buildingId: string;
  from: string | null;
  to: string;
  instance?: number;
}

export interface ResearchJob extends UpgradeJob {
  queue: ResearchQueueId;
  nodeId: string;
  from: number;
  to: number;
}

export interface UpgradeLogEntry {
  at: string;
  category: "building" | "research";
  item: string;
  from: string;
  to: string;
  cost: { itemId: string; amount: number }[];
  power: number;
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
  research?: Record<string, { level: number }>;
  researchPlan?: ResearchPlan;
  queues?: { construction?: ConstructionJob[]; research?: ResearchJob[] };
  upgradeLog?: UpgradeLogEntry[];
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
