import type {
  AllianceFacilityState,
  AllianceState,
  AllianceTechNodeState,
} from "./alliance";
import type {
  BeastPlanState,
  CoreEventsImports,
  CoreEventState,
} from "./coreEvents";
import type { DailiesState } from "./dailies";
import type { DaybreakState } from "./daybreak";
import type { EventResultState, UserEventState } from "./events";
import type {
  ExpertsPlanState,
  ExpertState,
  LearningJobState,
} from "./experts";
import type { LabyrinthState } from "./labyrinth";
import type { PetsPlanState, PetState } from "./pets";
import type { SkinState } from "./skins";
import type { TrainingJobState, TroopsPlanState, TroopsState } from "./troops";
import type { TundraAlbumState } from "./tundraAlbum";
import type { UnlockOverrides } from "./unlocks";
import type { VipState } from "./vip";

export type Theme = "light" | "dark" | "system";

export type CoreEventId = "svs" | "showdown" | "king" | "hall";

export interface UiSettings {
  furnaceFullLabels?: boolean;
  hideMaxed?: boolean;
  calcUseBonuses?: boolean;
  calcShowSpeedups?: boolean;
  calcShowEventPoints?: boolean;
}

/**
 * Language and region choices are saved as text. A value this version does not know, such as a
 * language from a newer backup, reads as the default.
 */
export interface Settings {
  theme?: Theme;
  language?: string;
  numberFormat?: string;
  dateFormat?: string;
  /** A time zone id such as America/New_York, or auto to follow the device. */
  timeZone?: string;
  ui?: UiSettings;
}

export interface BuildingState {
  level?: string | null;
  goal?: string | null;
  built?: boolean;
  instances?: string[];
}

/** The plans that can spend the general speedups. Their shares add up to 100 at most. */
export type GeneralSpeedupUse = "buildings" | "research" | "troops" | "experts";

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
  category: "building" | "research" | "training" | "learning";
  item: string;
  from: string;
  to: string;
  cost: { itemId: string; amount: number }[];
  power: number;
}

export interface HeroState {
  owned?: boolean;
  star?: number;
  tier?: number;
  level?: number;
  skills?: Record<string, number>;
  talent?: number;
  weapon?: number;
  shards?: number;
}

export interface HeroGoal {
  star: number;
  tier: number;
  skills?: Record<string, number>;
  weapon?: number;
}

export interface LuckyWheelPlan {
  heroId: string;
  spins: number;
  tokens: number;
}

export interface HeroesPlan {
  goals: Record<string, HeroGoal>;
  luckyWheel?: LuckyWheelPlan;
  savedAt: string;
}

export type TroopType = "infantry" | "lancer" | "marksman";
export type HeroGearSlot = "goggles" | "gloves" | "belt" | "boots";

export type HeroGearQuality =
  "common" | "uncommon" | "rare" | "epic" | "mythic";

export interface HeroGearPiece {
  quality?: HeroGearQuality;
  enhancement: number;
  empowerment: number;
  forging: string | null;
}

export interface HeroGearSet {
  id: string;
  name: string;
  troopType: TroopType;
  heroId?: string;
  pieces: Record<HeroGearSlot, HeroGearPiece>;
}

export interface HeroGearGoal {
  enhancement?: number;
  empowerment?: number;
  forging?: string | null;
}

export interface HeroGearPlan {
  rows: { setId: string; slot: HeroGearSlot }[];
  goals: Record<string, Partial<Record<HeroGearSlot, HeroGearGoal>>>;
  savedAt: string;
}

export interface ChiefGearPlan {
  goals: Record<string, string>;
  savedAt: string;
}

export interface ChiefCharmsPlan {
  goals: Record<string, (string | null)[]>;
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
  unlockOverrides?: UnlockOverrides;
  /** The March Queue Pack adds one march queue. */
  marchQueuePack?: boolean;
  /** The Construction Pack opens the second builder. */
  constructionPack?: boolean;
  notes?: string;
  buildings?: Record<string, BuildingState>;
  facilities?: Record<string, { built?: boolean }>;
  buildingPlan?: BuildingPlan;
  inventory?: Record<string, number>;
  generalSpeedupShare?: Partial<Record<GeneralSpeedupUse, number>>;
  research?: Record<string, { level: number }>;
  researchPlan?: ResearchPlan;
  queues?: {
    construction?: ConstructionJob[];
    research?: ResearchJob[];
    training?: TrainingJobState[];
    learning?: LearningJobState[];
  };
  upgradeLog?: UpgradeLogEntry[];
  heroes?: Record<string, HeroState>;
  heroesPlan?: HeroesPlan;
  heroGear?: { sets: HeroGearSet[] };
  heroGearPlan?: HeroGearPlan;
  chiefGear?: Record<string, { current?: string | null }>;
  chiefGearPlan?: ChiefGearPlan;
  chiefCharms?: Record<string, { current?: string | null }[]>;
  chiefCharmsPlan?: ChiefCharmsPlan;
  troops?: TroopsState;
  troopsPlan?: TroopsPlanState;
  experts?: Record<string, ExpertState>;
  expertsPlan?: ExpertsPlanState;
  pets?: Record<string, PetState>;
  petsPlan?: PetsPlanState;
  alliance?: AllianceState;
  events?: Partial<Record<CoreEventId, CoreEventState>>;
  coreEvents?: CoreEventsImports;
  beastPlan?: BeastPlanState;
  userEvents?: UserEventState[];
  eventsTimeZone?: "utc" | "local";
  eventResults?: EventResultState[];
  dailies?: DailiesState;
  daybreak?: DaybreakState;
  tundraAlbum?: Record<string, TundraAlbumState>;
  labyrinth?: LabyrinthState;
  skins?: Record<string, SkinState>;
  vip?: VipState;
  allianceTech?: Record<string, AllianceTechNodeState>;
  allianceFacilities?: Record<string, AllianceFacilityState>;
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
  unlockOverrides?: UnlockOverrides;
  marchQueuePack?: boolean;
  constructionPack?: boolean;
  notes?: string;
}

export type * from "./troops";
export type * from "./alliance";
export type * from "./coreEvents";
export type * from "./dailies";
export type * from "./daybreak";
export type * from "./events";
export type * from "./skins";
export type * from "./labyrinth";
export type * from "./tundraAlbum";
export type * from "./unlocks";
export type * from "./vip";
export type * from "./experts";
export type * from "./pets";
