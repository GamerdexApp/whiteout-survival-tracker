import { useTranslations } from "next-intl";
import { formatDuration, formatNumber } from "@/lib/format";
import { TROOP_IDS } from "@/service/troops";
import type { TroopsPlanDraft, TroopsPlanResult } from "@/service/troopsPlan";
import { findItem } from "@/data/game/items";
import { allTroops, MAX_TIER } from "@/data/game/troops";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const signed = (value: number) => (value > 0 ? `+${formatNumber(value)}` : formatNumber(value));

const touchesTopTier = (draft: TroopsPlanDraft) =>
	draft.runs.some((run) => run.tier === MAX_TIER || run.toTier === MAX_TIER);

export function TroopsPlanResultCard({
	draft,
	result,
	canExport,
	onExport,
}: {
	draft: TroopsPlanDraft;
	result: TroopsPlanResult;
	canExport: boolean;
	onExport: () => void;
}) {
	const t = useTranslations("troops.plan.result");
	const tExport = useTranslations("troops.plan.export");
	const { calculation } = result;
	const changedTiers = calculation.tiers.filter(
		(row) => row.total !== 0 || TROOP_IDS.some((id) => row[id] !== 0)
	);
	const nameOf = (id: string) => allTroops.find((troop) => troop.id === id)?.name ?? id;

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h3 className="font-semibold">{t("title")}</h3>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("resources")}</SectionLabel>
				{calculation.resources.map((resource) => {
					const item = findItem(resource.itemId);
					return (
						<div
							key={resource.itemId}
							className="flex items-center justify-between gap-3"
						>
							<span className="flex items-center gap-2">
								<ItemIcon src={item?.img} size={20} />
								{item?.name ?? resource.itemId}
							</span>
							<span className="font-mono">{formatNumber(resource.amount)}</span>
						</div>
					);
				})}
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("changes")}</SectionLabel>
				<div className="overflow-x-auto">
					<table className="w-full text-right">
						<thead>
							<tr>
								<th className="py-1 text-left font-normal">
									<SectionLabel className="text-muted">
										{t("heads.tier")}
									</SectionLabel>
								</th>
								{TROOP_IDS.map((id) => (
									<th key={id} className="py-1 pl-2 font-normal">
										<SectionLabel className="text-muted">
											{t(`heads.${id}`)}
										</SectionLabel>
									</th>
								))}
								<th className="py-1 pl-2 font-normal">
									<SectionLabel className="text-muted">
										{t("heads.all")}
									</SectionLabel>
								</th>
							</tr>
						</thead>
						<tbody>
							{changedTiers.map((row) => (
								<tr key={row.tier} className="border-line border-t-[1.5px]">
									<td className="py-1.5 text-left">
										{t("tier", { tier: formatNumber(row.tier) })}
									</td>
									{TROOP_IDS.map((id) => (
										<td key={id} className="pl-2 font-mono">
											{signed(row[id])}
										</td>
									))}
									<td className="pl-2 font-mono">{signed(row.total)}</td>
								</tr>
							))}
							<tr className="border-line border-t-[1.5px] font-semibold">
								<td className="py-1.5 text-left">{t("total")}</td>
								{TROOP_IDS.map((id) => (
									<td key={id} className="pl-2 font-mono">
										{signed(calculation.totals[id])}
									</td>
								))}
								<td className="pl-2 font-mono">
									{signed(calculation.totals.total)}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
			<div className="flex flex-col gap-1">
				<SectionLabel className="text-muted">{t("time")}</SectionLabel>
				{TROOP_IDS.map((id) => (
					<div key={id} className="flex justify-between gap-3">
						<span>{nameOf(id)}</span>
						<span className="font-mono">
							{formatDuration(calculation.camps[id].seconds)}
						</span>
					</div>
				))}
			</div>
			<div className="border-line flex flex-col gap-1 border-t-[1.5px] pt-3">
				<TotalLine
					label={t("totalTime")}
					value={formatDuration(calculation.totalSeconds)}
					strong
				/>
				<TotalLine
					label={t("longest")}
					value={formatDuration(calculation.longestCampSeconds)}
				/>
				<TotalLine
					label={t("minutesNeeded")}
					value={t("minutes", { value: formatNumber(calculation.speedupMinutesNeeded) })}
				/>
				<TotalLine
					label={t("minutesUsed")}
					value={t("minutes", { value: formatNumber(result.speedupMinutesUsed) })}
				/>
			</div>
			{touchesTopTier(draft) && <p className="text-muted text-xs">{t("tier12Note")}</p>}
			<div className="flex flex-col gap-1">
				<Button variant="ghost" disabled={!canExport} onClick={onExport}>
					{tExport("button")}
				</Button>
				{!canExport && <p className="text-muted text-xs">{tExport("emptyHint")}</p>}
			</div>
		</Card>
	);
}

function TotalLine({
	label,
	value,
	strong = false,
}: {
	label: string;
	value: string;
	strong?: boolean;
}) {
	return (
		<div className={`flex justify-between gap-3 ${strong ? "font-semibold" : ""}`}>
			<span>{label}</span>
			<span className="font-mono">{value}</span>
		</div>
	);
}
