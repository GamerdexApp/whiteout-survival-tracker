import { useTranslations } from "next-intl";
import type { PlanId } from "@/service/planOverview";

/** The display name of a plan. Beasts has no name in the power groups, so it has its own. */
export function usePlanNames() {
  const groups = useTranslations("overview.power.groups");
  const own = useTranslations("planOverview");
  return (id: PlanId) => (id === "beasts" ? own("beastsName") : groups(id));
}
