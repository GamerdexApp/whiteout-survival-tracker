"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { formatNumber } from "@/lib/format";
import type { EventPoints, PlanOverview, PlanSummary } from "@/service/planOverview";
import { Card } from "@/comps/ui/Card";
import { planDot } from "./planColors";
import { usePlanNames } from "./usePlanNames";

const EVENTS = ["svs", "showdown", "king", "hall"] as const;

type Metric = "power" | (typeof EVENTS)[number];

const COLUMNS = "lg:grid-cols-[minmax(0,1.5fr)_repeat(5,minmax(0,1fr))]";

export function OverviewPoints({ overview }: { overview: PlanOverview }) {
	const t = useTranslations("planOverview.points");
	const tEvents = useTranslations("eventExport");
	const tNav = useTranslations("shell.nav.items");
	const tCommon = useTranslations("common");
	const tHero = useTranslations("heroes.plan.result");
	const names = usePlanNames();
	const [metric, setMetric] = useState<Metric>("svs");

	const label = (id: Metric) =>
		id === "power" ? tCommon("powerGained") : tEvents(`events.${id}`);
	const pointsText = (value: number) => (value > 0 ? formatNumber(value) : tEvents("notScored"));
	const powerText = (plan: PlanSummary) =>
		plan.power === null ? tHero("unknown") : `+${formatNumber(plan.power)}`;
	const valueOf = (plan: PlanSummary, id: Metric) =>
		id === "power" ? powerText(plan) : pointsText(plan.points[id]);
	const totalOf = (id: Metric) =>
		id === "power"
			? `+${formatNumber(overview.power)}`
			: formatNumber((overview.points as EventPoints)[id]);

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h2 className="font-semibold">{t("title")}</h2>
				<Link href="/core-events" className="text-link font-medium underline">
					{tNav("coreEvents")}
				</Link>
			</div>
			<p className="text-muted">{t("description")}</p>
			<div
				role="group"
				aria-label={t("show")}
				className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden"
			>
				{(["power", ...EVENTS] as Metric[]).map((id) => (
					<button
						key={id}
						type="button"
						aria-pressed={metric === id}
						onClick={() => setMetric(id)}
						className={`flex min-h-11 shrink-0 items-center rounded-full border-[1.5px] px-3 font-medium whitespace-nowrap ${
							metric === id ? "border-primary bg-tint" : "border-line bg-surface"
						}`}
					>
						{label(id)}
					</button>
				))}
			</div>
			<ul className="flex flex-col lg:hidden">
				{overview.plans.map((plan) => (
					<li
						key={plan.id}
						className="border-line flex items-center justify-between gap-3 border-t-[1.5px] py-2.5"
					>
						<span className="flex items-center gap-2 font-medium">
							<span
								aria-hidden="true"
								className={`size-2.5 rounded-xs ${planDot[plan.id]}`}
							/>
							{names(plan.id)}
						</span>
						<span className="font-mono">{valueOf(plan, metric)}</span>
					</li>
				))}
				<li className="bg-tint flex items-center justify-between gap-3 rounded-md px-3 py-2.5 font-semibold">
					<span>{t("allPlans")}</span>
					<span className="text-primary font-mono">{totalOf(metric)}</span>
				</li>
			</ul>
			<div className="hidden lg:block">
				<div
					className={`border-line text-muted grid gap-x-3 border-b-[1.5px] pb-1.5 font-mono text-[11px] tracking-[0.08em] uppercase ${COLUMNS}`}
				>
					<span>{t("plan")}</span>
					{(["power", ...EVENTS] as Metric[]).map((id) => (
						<span key={id} className="text-end">
							{label(id)}
						</span>
					))}
				</div>
				{overview.plans.map((plan) => (
					<div
						key={plan.id}
						className={`border-line grid items-center gap-x-3 border-b-[1.5px] py-2 font-mono text-[13px] ${COLUMNS}`}
					>
						<span className="flex items-center gap-2 font-sans text-sm font-medium">
							<span
								aria-hidden="true"
								className={`size-2.5 rounded-xs ${planDot[plan.id]}`}
							/>
							{names(plan.id)}
						</span>
						{(["power", ...EVENTS] as Metric[]).map((id) => (
							<span key={id} className="text-end">
								{valueOf(plan, id)}
							</span>
						))}
					</div>
				))}
				<div
					className={`bg-tint mt-2 grid items-center gap-x-3 rounded-md px-2 py-2.5 font-mono text-[13px] font-medium ${COLUMNS}`}
				>
					<span className="font-sans text-sm font-semibold">{t("allPlans")}</span>
					{(["power", ...EVENTS] as Metric[]).map((id) => (
						<span
							key={id}
							className={`text-end ${id === "power" || id === "svs" ? "text-primary" : ""}`}
						>
							{totalOf(id)}
						</span>
					))}
				</div>
			</div>
			{overview.unknownPower.length > 0 && (
				<p className="text-muted text-xs">{t("unknownPower")}</p>
			)}
		</Card>
	);
}
