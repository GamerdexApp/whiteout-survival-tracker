import type { ComponentType } from "react";
import type { CalculatorId } from "@/data/calculators";
import { BeastCalculator } from "./BeastCalculator";
import { BuildingCalculator } from "./BuildingCalculator";
import { ChiefCharmCalculator } from "./ChiefCharmCalculator";
import { ChiefGearCalculator } from "./ChiefGearCalculator";
import { ExpertCalculator } from "./ExpertCalculator";
import { HeroGearCalculator } from "./HeroGearCalculator";
import { HeroUpgradeCalculator } from "./HeroUpgradeCalculator";
import { PetCalculator } from "./PetCalculator";
import { ResearchCalculator } from "./ResearchCalculator";
import { TroopCalculator } from "./TroopCalculator";

export const calculatorComponents: Record<CalculatorId, ComponentType> = {
	beast: BeastCalculator,
	building: BuildingCalculator,
	chiefCharm: ChiefCharmCalculator,
	chiefGear: ChiefGearCalculator,
	expert: ExpertCalculator,
	heroGear: HeroGearCalculator,
	heroUpgrade: HeroUpgradeCalculator,
	pet: PetCalculator,
	research: ResearchCalculator,
	troop: TroopCalculator,
};
