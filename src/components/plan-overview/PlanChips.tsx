"use client";

import { useTranslations } from "next-intl";
import type { PlanId } from "@/service/planOverview";
import { PLAN_IDS } from "@/service/planOverview";
import { Card } from "@/comps/ui/Card";
import { planDot } from "./planColors";
import { usePlanNames } from "./usePlanNames";

interface PlanChipsProps {
	available: PlanId[];
	off: PlanId[];
	onToggle: (plan: PlanId) => void;
	onPlanBeasts: () => void;
}

export function PlanChips({ available, off, onToggle, onPlanBeasts }: PlanChipsProps) {
	const t = useTranslations("planOverview.plans");
	const names = usePlanNames();

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="font-semibold">{t("title")}</h2>
			<div className="flex flex-wrap gap-2">
				{PLAN_IDS.map((id) => {
					const saved = available.includes(id);
					const on = saved && !off.includes(id);
					const opensFlyout = id === "beasts" && !saved;
					return (
						<button
							key={id}
							type="button"
							aria-pressed={on}
							disabled={!saved && !opensFlyout}
							onClick={() => (opensFlyout ? onPlanBeasts() : onToggle(id))}
							className={`flex min-h-11 items-center gap-2 rounded-full border-[1.5px] px-3 font-medium lg:min-h-9 ${
								!saved
									? `border-line text-muted border-dashed ${opensFlyout ? "hover:bg-tint" : "opacity-60"}`
									: on
										? "border-primary bg-tint text-ink"
										: "border-line bg-surface text-muted hover:bg-tint"
							}`}
						>
							<span
								aria-hidden="true"
								className={`size-2.5 shrink-0 rounded-full ${saved ? planDot[id] : "bg-muted"}`}
							/>
							{names(id)}
							{!saved && (
								<span className="text-xs font-normal">
									{opensFlyout ? t("addBeasts") : t("noPlan")}
								</span>
							)}
						</button>
					);
				})}
			</div>
			<p className="text-muted text-xs">{t("hint")}</p>
		</Card>
	);
}
