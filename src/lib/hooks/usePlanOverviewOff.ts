"use client";

import { useSyncExternalStore } from "react";
import type { PlanId } from "@/service/planOverview";
import { planOverviewState } from "@/service/planOverviewState";

const NONE: PlanId[] = [];

/** The plans switched off for a chief, and a function that switches one on or off. */
export function usePlanOverviewOff(chiefId: string) {
  const all = useSyncExternalStore(
    planOverviewState.subscribe,
    planOverviewState.load,
    planOverviewState.loadOnServer,
  );
  const off = all[chiefId] ?? NONE;
  const toggle = (plan: PlanId) =>
    planOverviewState.setOff(
      chiefId,
      off.includes(plan) ? off.filter((id) => id !== plan) : [...off, plan],
    );
  return { off, toggle };
}
