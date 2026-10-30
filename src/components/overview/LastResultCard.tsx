import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { lastResultOf } from "@/service/overviewEvents";
import { gameEventOf } from "@/data/game/coreEvents";
import { DiffText } from "@/comps/history/DiffText";
import { entryHref } from "@/comps/history/HistoryList";
import { useHistoryText } from "@/comps/history/useHistoryText";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { OverviewCard } from "./OverviewCard";

function ResultLine({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex items-baseline justify-between gap-3 py-2">
			<dt>{label}</dt>
			<dd className="font-mono">{children}</dd>
		</div>
	);
}

export function LastResultCard({ chief, className }: { chief: Playthrough; className?: string }) {
	const t = useTranslations("overview.lastResult");
	const { titleOf, rankOf } = useHistoryText();
	const result = lastResultOf(chief);
	if (!result) return null;

	const { row } = result;
	const href = entryHref(row);

	return (
		<OverviewCard
			icon={<ItemIcon src={gameEventOf(row.event).img} size={32} />}
			title={t("title")}
			href={href}
			linkLabel={t("open")}
			className={className}
		>
			<div className="flex flex-col">
				<Link href={href} className="min-h-11 font-semibold">
					{titleOf(row.event, row.entry)}
				</Link>
				{row.event === "svs" && <span className="text-muted">{t("days")}</span>}
			</div>
			<dl className="divide-line divide-y-[1.5px]">
				<ResultLine label={t("plan")}>{formatNumber(row.plan)}</ResultLine>
				<ResultLine label={t("actual")}>{formatNumber(row.actual)}</ResultLine>
				<ResultLine label={t("difference")}>
					<DiffText difference={row.difference} percent={row.percent} />
				</ResultLine>
				<ResultLine label={t("overall")}>{rankOf(row.rank)}</ResultLine>
				<ResultLine label={t("alliance")}>{rankOf(row.allianceRank)}</ResultLine>
				{result.upgradesPlanned > 0 && (
					<ResultLine label={t("upgrades")}>
						{t("upgradesOf", {
							done: formatNumber(result.upgradesDone),
							total: formatNumber(result.upgradesPlanned),
						})}
					</ResultLine>
				)}
			</dl>
		</OverviewCard>
	);
}
