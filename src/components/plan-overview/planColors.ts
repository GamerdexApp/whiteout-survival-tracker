import type { PlanId } from "@/service/planOverview";

/** The color that marks each plan in every section of the overview. */
export const planDot: Record<PlanId, string> = {
  buildings: "bg-primary",
  research: "bg-fixed",
  troops: "bg-kept",
  experts: "bg-changed",
  pets: "bg-gold",
  heroes: "bg-added",
  heroGear: "bg-accent",
  chiefGear: "bg-locked",
  chiefCharms: "bg-warn",
  beasts: "bg-ink",
};
