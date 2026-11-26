import { useTranslations } from "next-intl";
import { formatDuration, formatNumber } from "@/lib/format";
import { TROOP_IDS } from "@/service/troops";
import type { TroopsPlanDraft, TroopsPlanResult } from "@/service/troopsPlan";
import { allTroops, MAX_TIER } from "@/data/game/troops";
import { ResultResources } from "@/comps/plans/ResultResources";
import { ResultStats } from "@/comps/plans/ResultStats";
import { Card } from "@/comps/ui/Card";
import { ScrollRegion } from "@/comps/ui/ScrollRegion";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const signed = (value: number) => (value > 0 ? `+${formatNumber(value)}` : formatNumber(value));

const touchesTopTier = (draft: TroopsPlanDraft) =>
	draft.runs.some((run) => run.tier === MAX_TIER || run.toTier === MAX_TIER);

export function TroopsPlanResultCard({
	draft,
	result,
}: {
	draft: TroopsPlanDraft;
	result: TroopsPlanResult;
}) {
	const t = useTranslations("troops.plan.result");
	const tCommon = useTranslations("common");
	const tCalc = useTranslations("calcTroop");
	const { calculation } = result;
	const changedTiers = calculation.tiers.filter(
		(row) => row.total !== 0 || TROOP_IDS.some((id) => row[id] !== 0)
	);
	const nameOf = (id: string) => allTroops.find((troop) => troop.id === id)?.name ?? id;
	const fireCrystalLevels = TROOP_IDS.map((id) =>
		tCalc("tiers.fireCrystalLevel", {
			name: nameOf(id),
			level: formatNumber(calculation.fireCrystalLevels[id]),
		})
	).join(", ");

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h3 className="font-semibold">{t("title")}</h3>
			<ResultResources items={calculation.resources} />
			<ResultStats
				stats={[
					{
						label: tCommon("powerGained"),
						value: signed(calculation.totalPower.total),
					},
					{
						label: t("minutesNeeded"),
						value: t("minutes", {
							value: formatNumber(calculation.speedupMinutesNeeded),
						}),
						emphasis: true,
					},
					{
						label: t("totalTime"),
						value: formatDuration(calculation.totalSeconds),
					},
					{
						label: t("longest"),
						value: formatDuration(calculation.longestCampSeconds),
					},
				]}
			/>
			{changedTiers.length > 0 && (
				<p className="text-muted text-xs">
					{tCalc("tiers.fireCrystalNote", { levels: fireCrystalLevels })}
				</p>
			)}
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("changes")}</SectionLabel>
				<ScrollRegion label={t("changes")}>
					<table className="w-full text-end">
						<thead>
							<tr>
								<th className="py-1 text-start font-normal">
									<SectionLabel className="text-muted">
										{t("heads.tier")}
									</SectionLabel>
								</th>
								{TROOP_IDS.map((id) => (
									<th key={id} className="py-1 ps-2 font-normal">
										<SectionLabel className="text-muted">
											{t(`heads.${id}`)}
										</SectionLabel>
									</th>
								))}
								<th className="py-1 ps-2 font-normal">
									<SectionLabel className="text-muted">
										{t("heads.all")}
									</SectionLabel>
								</th>
							</tr>
						</thead>
						<tbody>
							{changedTiers.map((row) => (
								<tr key={row.tier} className="border-line border-t-[1.5px]">
									<td className="py-1.5 text-start">
										{t("tier", { tier: formatNumber(row.tier) })}
									</td>
									{TROOP_IDS.map((id) => (
										<td key={id} className="ps-2 font-mono">
											{signed(row[id])}
										</td>
									))}
									<td className="ps-2 font-mono">{signed(row.total)}</td>
								</tr>
							))}
							<tr className="border-line border-t-[1.5px] font-semibold">
								<td className="py-1.5 text-start">{t("total")}</td>
								{TROOP_IDS.map((id) => (
									<td key={id} className="ps-2 font-mono">
										{signed(calculation.totals[id])}
									</td>
								))}
								<td className="ps-2 font-mono">
									{signed(calculation.totals.total)}
								</td>
							</tr>
						</tbody>
					</table>
				</ScrollRegion>
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
			{touchesTopTier(draft) && <p className="text-muted text-xs">{t("tier12Note")}</p>}
		</Card>
	);
}
