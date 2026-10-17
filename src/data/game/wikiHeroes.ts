import { heroWidgets } from "whiteout-survival-data";
import type { HeroClass, HeroSubClass } from "whiteout-survival-data";

export const widgetLevels = heroWidgets().get();

export const heroSubClasses: HeroSubClass[] = ["Growth", "Combat"];
export const heroClassIds: HeroClass[] = ["Infantry", "Lancer", "Marksman"];
