import type { Building } from "whiteout-survival-data";
import type { AgeHints } from "@/service/buildings";
import { ageHintOf, notBuiltLabel } from "@/service/buildings";
import type { StepperStop } from "@/comps/ui/LevelStepper";

export const NOT_BUILT_VALUE = "";

const cache = new WeakMap<Building, StepperStop[]>();

/**
 * Every level in the package order.
 */
export const builtStops = (building: Building): StepperStop[] => {
  const cached = cache.get(building);
  if (cached) return cached;

  const stops = building.levels.map((level) => ({
    value: level.label,
    label: level.label,
  }));
  cache.set(building, stops);
  return stops;
};

/**
 * Every level in the package order. A level the server age has not unlocked carries its unlock
 * text as a hint.
 */
export const hintedStops = (
  building: Building,
  hints: AgeHints,
): StepperStop[] =>
  builtStops(building).map((stop) => ({
    ...stop,
    hint: ageHintOf(hints, stop.value),
  }));

/**
 * The first stop is Not built, then every level in the package order.
 */
export const levelStops = (
  building: Building,
  hints: AgeHints,
): StepperStop[] => [
  { value: NOT_BUILT_VALUE, label: notBuiltLabel() },
  ...hintedStops(building, hints),
];
