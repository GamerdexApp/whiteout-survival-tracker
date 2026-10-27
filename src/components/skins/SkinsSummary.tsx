"use client";

import { useTranslations } from "next-intl";
import { formatDecimal, formatNumber } from "@/lib/format";
import type { StatTotal, SkinsSummary as Summary } from "@/service/skins";
import { Card } from "@/comps/ui/Card";
import { Note } from "@/comps/ui/Note";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";

export function OwnedTile({ summary }: { summary: Summary }) {
	const t = useTranslations("skins.owned");

	return (
		<Card className="flex flex-col gap-2 px-4 py-3">
			<SectionLabel className="text-muted">{t("label")}</SectionLabel>
			<span className="font-mono text-2xl">
				{t("value", {
					owned: formatNumber(summary.owned),
					total: formatNumber(summary.total),
				})}
			</span>
			<ProgressBar
				value={summary.total === 0 ? 0 : summary.owned / summary.total}
				label={t("progress")}
			/>
			<span className="text-muted">
				{t("withBonus", {
					withBonus: formatNumber(summary.withBonus),
					total: formatNumber(summary.total),
				})}
			</span>
		</Card>
	);
}

export function BonusTotalsCard({ totals, summary }: { totals: StatTotal[]; summary: Summary }) {
	const t = useTranslations("skins.totals");

	return (
		<Card className="flex flex-col gap-3 px-4 py-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="font-semibold">{t("title")}</h2>
			</div>
			{totals.length === 0 ? (
				<p className="text-muted">{t("none")}</p>
			) : (
				<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
					{totals.map((total) => (
						<li
							key={total.statKey}
							className="bg-tint flex flex-col rounded-md px-3 py-2"
						>
							<span className="font-mono text-xl">
								{t(total.unit === "percent" ? "percent" : "flat", {
									amount: formatDecimal(total.amount),
								})}
							</span>
							<span className="text-muted">{total.stat}</span>
						</li>
					))}
				</ul>
			)}
			<p className="text-muted text-xs">
				{t("note", {
					count: summary.ownedWithBonus,
					amount: formatNumber(summary.ownedWithBonus),
				})}
			</p>
		</Card>
	);
}

export function ExpiryNote() {
	const t = useTranslations("skins.expiry");
	return <Note title={t("title")}>{t("text")}</Note>;
}
