"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatNumber } from "@/lib/format";
import type { OverviewGroupId, OverviewRow, PlanOverview } from "@/service/planOverview";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { planDot } from "./planColors";
import { usePlanNames } from "./usePlanNames";

const COLLAPSED_GROUPS: OverviewGroupId[] = ["other"];

function UsedBy({ row }: { row: OverviewRow }) {
	const names = usePlanNames();
	const total = row.parts.reduce((sum, part) => sum + part.amount, 0);

	return (
		<div className="flex min-w-0 flex-col gap-1.5">
			<div className="bg-track flex h-2 overflow-hidden rounded-full">
				{row.parts.map((part) => (
					<span
						key={part.plan}
						className={`h-2 shrink-0 ${planDot[part.plan]}`}
						style={{ width: `${(part.amount / total) * 100}%` }}
					/>
				))}
			</div>
			<ul className="text-muted flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
				{row.parts.map((part) => (
					<li key={part.plan} className="flex items-center gap-1.5">
						<span
							aria-hidden="true"
							className={`size-2 shrink-0 rounded-xs ${planDot[part.plan]}`}
						/>
						{names(part.plan)} {formatNumber(part.amount)}
					</li>
				))}
			</ul>
		</div>
	);
}

const COLUMNS = "lg:grid-cols-[170px_140px_140px_140px_minmax(0,1fr)] lg:gap-x-5";

function ItemRow({ row }: { row: OverviewRow }) {
	const t = useTranslations("queues.planStock");
	const shortBy = Math.max(0, row.needed - row.available);
	const enough = shortBy === 0;
	const amount = (value: number) => `${formatNumber(value)}${row.unit ? ` ${row.unit}` : ""}`;

	return (
		<li
			className={`border-line grid items-center gap-x-3 gap-y-2 border-t-[1.5px] py-3 ${COLUMNS}`}
		>
			<div className="flex min-w-0 flex-col">
				<span className="font-medium">{row.name}</span>
				{row.detail && <span className="text-muted text-xs">{row.detail}</span>}
			</div>
			<span className="flex justify-between gap-3 font-mono text-sm lg:justify-end">
				<span className="text-muted text-xs lg:hidden">{t("needed", { amount: "" })}</span>
				{amount(row.needed)}
			</span>
			<span className="flex justify-between gap-3 font-mono text-sm lg:justify-end">
				<span className="text-muted text-xs lg:hidden">
					{t("available", { amount: "" })}
				</span>
				{amount(row.available)}
			</span>
			<div className="flex flex-col items-start gap-1">
				<Badge tone={enough ? "kept" : "changed"}>
					{enough ? t("enough") : t("notEnough")}
				</Badge>
				<span className={`font-mono text-xs ${enough ? "text-kept" : "text-danger"}`}>
					{enough
						? t("leftOver", { amount: amount(row.available - row.needed) })
						: t("shortBy", { amount: amount(shortBy) })}
				</span>
			</div>
			<UsedBy row={row} />
		</li>
	);
}

export function OverviewResources({ overview }: { overview: PlanOverview }) {
	const t = useTranslations("planOverview.resources");
	const tStock = useTranslations("queues.planStock");
	const [opened, setOpened] = useState<OverviewGroupId[]>([]);
	const names = usePlanNames();

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h2 className="font-semibold">{tStock("title")}</h2>
				<span className="text-muted font-mono text-xs">
					{tStock("shortCount", {
						short: formatNumber(overview.shortCount),
						total: formatNumber(overview.itemCount),
					})}
				</span>
			</div>
			<p className="text-muted">{t("description")}</p>
			<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
				<SectionLabel className="text-muted">{t("usedBy")}</SectionLabel>
				{overview.plans.map((plan) => (
					<span key={plan.id} className="flex items-center gap-1.5 text-xs">
						<span
							aria-hidden="true"
							className={`size-2.5 shrink-0 rounded-xs ${planDot[plan.id]}`}
						/>
						{names(plan.id)}
					</span>
				))}
			</div>
			<div
				className={`border-line text-muted hidden gap-x-3 border-b-[1.5px] pb-1.5 font-mono text-[11px] tracking-[0.08em] uppercase lg:grid ${COLUMNS}`}
			>
				<span>{t("heads.item")}</span>
				<span className="text-end">{t("heads.needed")}</span>
				<span className="text-end">{t("heads.have")}</span>
				<span>{t("heads.status")}</span>
				<span>{t("usedBy")}</span>
			</div>
			{overview.groups
				.filter((group) => group.rows.length > 0)
				.map((group) => {
					const collapsed =
						COLLAPSED_GROUPS.includes(group.id) && !opened.includes(group.id);
					const short = group.rows.filter((row) => row.needed > row.available).length;
					return (
						<div key={group.id} className="flex flex-col">
							<div className="flex items-center justify-between gap-3 pt-2 pb-1">
								<SectionLabel className="text-muted">
									{t(`groups.${group.id}`)}
								</SectionLabel>
								<span className="flex items-center gap-3">
									<span className="text-muted font-mono text-xs">
										{tStock("shortCount", {
											short: formatNumber(short),
											total: formatNumber(group.rows.length),
										})}
									</span>
									{COLLAPSED_GROUPS.includes(group.id) && (
										<Button
											onClick={() =>
												setOpened(
													opened.includes(group.id)
														? opened.filter((id) => id !== group.id)
														: [...opened, group.id]
												)
											}
										>
											{collapsed
												? t("show", {
														count: group.rows.length,
														amount: formatNumber(group.rows.length),
													})
												: t("hide")}
										</Button>
									)}
								</span>
							</div>
							{!collapsed && (
								<ul className="flex flex-col">
									{group.rows.map((row) => (
										<ItemRow key={row.id} row={row} />
									))}
								</ul>
							)}
						</div>
					);
				})}
			<p className="text-muted text-xs">{t("generalNote")}</p>
		</Card>
	);
}
