import type { BuildingLevelOrders } from "@/lib/sync/schema";
import { allBuildings } from "./buildings";

export const buildingLevelOrders: BuildingLevelOrders = Object.fromEntries(
  allBuildings.map((building) => [
    building.id,
    Object.fromEntries(
      building.levels.map((level) => [level.label, level.order]),
    ),
  ]),
);
