export const CALCULATOR_IDS = [
  "beast",
  "building",
  "chiefCharm",
  "chiefGear",
  "expert",
  "heroGear",
  "heroUpgrade",
  "pet",
  "research",
  "troop",
] as const;

export type CalculatorId = (typeof CALCULATOR_IDS)[number];

export interface CalculatorInfo {
  id: CalculatorId;
  slug: string;
  /** The namespace of the labels of this calculator. */
  namespace: `calc${Capitalize<CalculatorId>}`;
}

export const calculators: CalculatorInfo[] = [
  { id: "beast", slug: "beast", namespace: "calcBeast" },
  { id: "building", slug: "building", namespace: "calcBuilding" },
  { id: "chiefCharm", slug: "chief-charm", namespace: "calcChiefCharm" },
  { id: "chiefGear", slug: "chief-gear", namespace: "calcChiefGear" },
  { id: "expert", slug: "expert", namespace: "calcExpert" },
  { id: "heroGear", slug: "hero-gear", namespace: "calcHeroGear" },
  { id: "heroUpgrade", slug: "hero-upgrade", namespace: "calcHeroUpgrade" },
  { id: "pet", slug: "pet", namespace: "calcPet" },
  { id: "research", slug: "research", namespace: "calcResearch" },
  { id: "troop", slug: "troop", namespace: "calcTroop" },
];

export const calculatorBySlug = (slug: string) =>
  calculators.find((calculator) => calculator.slug === slug);
