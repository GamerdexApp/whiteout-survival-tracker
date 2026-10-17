import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { changedTierRows } from "@/service/calcTroop";
import { TROOP_TYPES } from "@/data/game/calcTroop";
import type { TroopCalculation } from "@/data/game/calcTroop";
import { Card } from "@/comps/ui/Card";
import { ScrollRegion } from "@/comps/ui/ScrollRegion";
import { useGameLabels } from "../../useGameLabels";

type TierRow = TroopCalculation["tiers"][number];

interface TierTableProps {
	title: string;
	rows: TierRow[];
	totals: Omit<TierRow, "tier">;
}

const signed = (value: number) => (value > 0 ? `+${formatNumber(value)}` : formatNumber(value));

const headClasses = "text-muted px-3 py-2 font-mono text-xs font-normal";

/** The change of each troop type by tier. Tiers without a change are left out. */
export function TierTable({ title, rows, totals }: TierTableProps) {
	const t = useTranslations("calcTroop");
	const labels = useGameLabels();

	return (
		<section className="flex flex-col gap-2">
			<h3 className="font-semibold">{title}</h3>
			<Card className="overflow-hidden">
				<ScrollRegion label={title} className="relative overflow-x-auto">
					<table className="w-full border-collapse text-end">
						<thead>
							<tr className="border-line border-b-[1.5px]">
								<th scope="col" className={`${headClasses} text-start`}>
									{t("tiers.heads.tier")}
								</th>
								{TROOP_TYPES.map((type) => (
									<th key={type} scope="col" className={headClasses}>
										{labels.troopId(type)}
									</th>
								))}
								<th scope="col" className={headClasses}>
									{t("tiers.heads.total")}
								</th>
							</tr>
						</thead>
						<tbody>
							{changedTierRows(rows).map((row) => (
								<tr key={row.tier} className="border-line border-t-[1.5px]">
									<th scope="row" className="px-3 py-2 text-start font-normal">
										{t("tier", { tier: formatNumber(row.tier) })}
									</th>
									{TROOP_TYPES.map((type) => (
										<td key={type} className="px-3 py-2 font-mono">
											{signed(row[type])}
										</td>
									))}
									<td className="px-3 py-2 font-mono">{signed(row.total)}</td>
								</tr>
							))}
							<tr className="border-line bg-tint border-t-[1.5px] font-semibold">
								<th scope="row" className="px-3 py-2 text-start">
									{t("tiers.total")}
								</th>
								{TROOP_TYPES.map((type) => (
									<td key={type} className="px-3 py-2 font-mono">
										{signed(totals[type])}
									</td>
								))}
								<td className="px-3 py-2 font-mono">{signed(totals.total)}</td>
							</tr>
						</tbody>
					</table>
				</ScrollRegion>
			</Card>
		</section>
	);
}
