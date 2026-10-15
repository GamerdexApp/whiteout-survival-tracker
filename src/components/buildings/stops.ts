import type { Building } from "whiteout-survival-data";
import { NOT_BUILT_LABEL } from "@/service/buildings";
import type { StepperStop } from "@/comps/ui/LevelStepper";

export const NOT_BUILT_VALUE = "";

const cache = new WeakMap<Building, StepperStop[]>();

/**
 * The first stop is Not built, then every level in the package order.
 */
export const levelStops = (building: Building): StepperStop[] => {
  const cached = cache.get(building);
  if (cached) return cached;

  const stops = [
    { value: NOT_BUILT_VALUE, label: NOT_BUILT_LABEL },
    ...building.levels.map((level) => ({
      value: level.label,
      label: level.label,
    })),
  ];
  cache.set(building, stops);
  return stops;
};
