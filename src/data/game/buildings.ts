import { buildings, facilities } from "whiteout-survival-data";
import type {
  Building,
  BuildingCategory,
  Facility,
} from "whiteout-survival-data";

export const FURNACE_ID = "furnace";
export const SHELTER_ID = "shelter";
export const MAX_SHELTERS = 8;

export const allBuildings: Building[] = buildings().get();
export const allFacilities: Facility[] = facilities().get();

export const furnace = buildings().find(FURNACE_ID) as Building;
export const shelter = buildings().find(SHELTER_ID) as Building;

export const isEntertainment = (building: Building) =>
  building.category === "Entertainment";

export const levelledBuildings = allBuildings.filter(
  (building) => !isEntertainment(building),
);
export const entertainmentBuildings = allBuildings.filter(isEntertainment);

export const buildingCategories: BuildingCategory[] = [
  "Military",
  "Inner City",
  "Entertainment",
];

export const findBuildingById = (id: string) => buildings().find(id);

export const buildingNotes: Record<string, string> = {
  furnace: "Gates every other building",
  shelter: "Up to 8 shelters, each with its own level",
};
