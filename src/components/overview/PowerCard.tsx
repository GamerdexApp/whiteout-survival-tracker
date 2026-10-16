"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { summarizePower } from "@/service/overviewPower";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { OverviewCard } from "./OverviewCard";

const percentOf = (value: number, of: number) => (of <= 0 ? 0 : Math.min(1, value / of));

export function PowerCard({ chief, className = "" }: { chief: Playthrough; className?: string }) {
	const t = useTranslations("overview.power");
	const summary = useMemo(() => summarizePower(chief), [chief]);
	const rows = [...summary.rows].sort((a, b) => b.power - a.power);

	return (
		<OverviewCard title={t("title")} className={className}>
			<div className="flex flex-col gap-1">
				<SectionLabel className="text-muted">{t("total")}</SectionLabel>
				<span className="flex flex-wrap items-baseline gap-x-2">
					<span className="font-mono text-3xl">{formatNumber(summary.total)}</span>
					<span className="text-muted font-mono">
						{t("ofPossible", { possible: formatNumber(summary.totalPossible) })}
					</span>
				</span>
				<ProgressBar
					value={percentOf(summary.total, summary.totalPossible)}
					label={t("totalProgress")}
				/>
				<span className="text-muted">
					{t("percentOfPossible", {
						percent: formatNumber(
							Math.round(percentOf(summary.total, summary.totalPossible) * 100)
						),
					})}
				</span>
				<span className="text-muted text-xs">{t("noCapNote")}</span>
				<span className="text-muted text-xs">
					{summary.withoutValue === 0
						? t("complete")
						: t("incomplete", {
								count: summary.withoutValue,
								amount: formatNumber(summary.withoutValue),
							})}
				</span>
			</div>
			<ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
				{rows.map((row) => (
					<li key={row.id} className="flex flex-col gap-1">
						<div className="flex items-baseline justify-between gap-3">
							<Link
								href={row.href}
								className="text-link inline-flex min-h-11 items-center font-medium underline lg:min-h-9"
							>
								{t(`groups.${row.id}`)}
							</Link>
							<span className="text-right font-mono">
								{row.possible === null
									? formatNumber(row.power)
									: t("rowOfPossible", {
											power: formatNumber(row.power),
											possible: formatNumber(row.possible),
										})}
							</span>
						</div>
						<ProgressBar
							value={row.possible === null ? 0 : percentOf(row.power, row.possible)}
							label={t("progress", { group: t(`groups.${row.id}`) })}
						/>
						<span className="text-muted text-xs">
							{row.possible === null
								? t("noMaximum")
								: t("percentOfPossible", {
										percent: formatNumber(
											Math.round(percentOf(row.power, row.possible) * 100)
										),
									})}
						</span>
						{row.withoutValue > 0 && (
							<span className="text-muted text-xs">
								{t("groupWithoutValue", {
									count: row.withoutValue,
									amount: formatNumber(row.withoutValue),
								})}
							</span>
						)}
					</li>
				))}
			</ul>
		</OverviewCard>
	);
}
