"use client";

import { useTranslations } from "next-intl";
import { formatDuration, formatNumber } from "@/lib/format";
import type { PlanOverview } from "@/service/planOverview";
import { PLAN_HREF } from "@/service/planOverview";
import { Button, ButtonLink } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { planDot } from "./planColors";
import { usePlanNames } from "./usePlanNames";

const COLUMNS = "lg:grid-cols-[150px_minmax(0,1fr)_100px_120px_110px]";

export function OverviewFullPlan({
	overview,
	onEditBeasts,
}: {
	overview: PlanOverview;
	onEditBeasts: () => void;
}) {
	const t = useTranslations("planOverview.fullPlan");
	const tCommon = useTranslations("common");
	const tHero = useTranslations("heroes.plan.result");
	const tPoints = useTranslations("planOverview.points");
	const names = usePlanNames();
	const separator = useTranslations("resources")("list.separator");

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
				<h2 className="font-semibold whitespace-nowrap">{t("title")}</h2>
				{overview.longestSeconds > 0 && (
					<span className="text-muted font-mono text-xs">
						{t("finishes", { time: formatDuration(overview.longestSeconds) })}
					</span>
				)}
			</div>
			<p className="text-muted">{t("description")}</p>
			{overview.queues.length > 0 && (
				<div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
					{overview.queues.map((queue) => (
						<div
							key={queue.id}
							className="bg-bg border-line flex flex-col rounded-md border-[1.5px] px-3 py-2"
						>
							<SectionLabel className="text-muted">
								{t(`queues.${queue.id}`)}
							</SectionLabel>
							<span className="font-mono text-base font-medium">
								{formatDuration(queue.seconds)}
							</span>
						</div>
					))}
				</div>
			)}
			<div
				className={`border-line text-muted hidden gap-x-3 border-b-[1.5px] pb-1.5 font-mono text-[11px] tracking-[0.08em] uppercase lg:grid ${COLUMNS}`}
			>
				<span>{t("heads.plan")}</span>
				<span>{t("heads.what")}</span>
				<span className="text-end">{t("heads.time")}</span>
				<span className="text-end">{tCommon("powerGained")}</span>
				<span />
			</div>
			<ul className="flex flex-col">
				{overview.plans.map((plan) => (
					<li
						key={plan.id}
						className={`border-line grid items-center gap-x-3 gap-y-2 border-b-[1.5px] py-3 ${COLUMNS}`}
					>
						<span className="flex items-center gap-2 font-semibold lg:font-medium">
							<span
								aria-hidden="true"
								className={`size-2.5 rounded-xs ${planDot[plan.id]}`}
							/>
							{names(plan.id)}
						</span>
						<span>{plan.what.join(separator)}</span>
						<span className="flex justify-between gap-3 font-mono lg:justify-end">
							{plan.queue ? formatDuration(plan.seconds) : t("noTimer")}
						</span>
						<span className="text-primary flex justify-between gap-3 font-mono lg:justify-end">
							{plan.power === null
								? tHero("unknown")
								: `+${formatNumber(plan.power)}`}
						</span>
						{PLAN_HREF[plan.id] ? (
							<ButtonLink href={PLAN_HREF[plan.id]!}>{t("open")}</ButtonLink>
						) : (
							<Button onClick={onEditBeasts}>{t("edit")}</Button>
						)}
					</li>
				))}
			</ul>
			<div
				className={`bg-tint grid items-center gap-x-3 gap-y-1 rounded-md px-3 py-2.5 font-semibold ${COLUMNS}`}
			>
				<span>{tPoints("allPlans")}</span>
				<span />
				<span className="font-mono lg:text-end">
					{formatDuration(overview.longestSeconds)}
				</span>
				<span className="text-primary font-mono lg:text-end">
					+{formatNumber(overview.power)}
				</span>
				<span />
			</div>
		</Card>
	);
}
