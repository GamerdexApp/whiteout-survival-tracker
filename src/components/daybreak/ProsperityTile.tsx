"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { ProsperitySummary } from "@/service/daybreak";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";

function Row({ label, value, max }: { label: string; value: number; max: number }) {
	const t = useTranslations("daybreak.prosperity");
	return (
		<div className="flex items-baseline justify-between gap-3">
			<span className="text-muted">{label}</span>
			<span className="text-end font-mono">
				{t("ofMax", { value: formatNumber(value), max: formatNumber(max) })}
			</span>
		</div>
	);
}

export function ProsperityTile({ summary }: { summary: ProsperitySummary }) {
	const t = useTranslations("daybreak.prosperity");

	return (
		<Card className="flex flex-col gap-2 px-4 py-3">
			<SectionLabel className="text-muted">{t("label")}</SectionLabel>
			<span className="font-mono text-2xl">{formatNumber(summary.now)}</span>
			<ProgressBar
				value={summary.max === 0 ? 0 : summary.now / summary.max}
				label={t("progress")}
			/>
			<span className="text-muted">{t("possible", { max: formatNumber(summary.max) })}</span>
			<div className="border-line flex flex-col gap-1 border-t-[1.5px] pt-2">
				<Row label={t("levelled")} value={summary.levelledNow} max={summary.levelledMax} />
				<Row label={t("limited")} value={summary.limitedNow} max={summary.limitedMax} />
			</div>
			{summary.ownedWithoutValue > 0 && (
				<p className="text-muted text-xs">
					{t("withoutValue", {
						count: summary.ownedWithoutValue,
						amount: formatNumber(summary.ownedWithoutValue),
					})}
				</p>
			)}
		</Card>
	);
}
