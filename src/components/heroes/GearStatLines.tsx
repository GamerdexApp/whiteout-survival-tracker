import { useTranslations } from "next-intl";
import type { HeroGearSet } from "@/types/app";
import { formatDecimal, formatNumber } from "@/lib/format";
import { allTroopTypes, pieceStats, slotIds, slotName, troopLabel } from "@/service/heroGear";
import { Card } from "@/comps/ui/Card";
import { ScrollRegion } from "@/comps/ui/ScrollRegion";
import { SectionLabel } from "@/comps/ui/SectionLabel";

export function GearStatLines({ set }: { set: HeroGearSet }) {
	const t = useTranslations("heroGear.statLines");
	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{t("title")}</h3>
			<ScrollRegion label={t("title")}>
				<table className="w-full min-w-136 text-start">
					<thead>
						<tr>
							<th className="w-24" />
							{allTroopTypes.map((troop) => (
								<th key={troop} className="py-1 pe-3">
									<SectionLabel
										className={
											troop === set.troopType ? "text-primary" : "text-muted"
										}
									>
										{troop === set.troopType
											? t("troopThisSet", { troop: troopLabel(troop) })
											: troopLabel(troop)}
									</SectionLabel>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{slotIds.map((slot) => (
							<tr key={slot} className="border-line border-t-[1.5px] align-top">
								<th scope="row" className="py-2 pe-3 font-semibold">
									{slotName(slot)}
								</th>
								{allTroopTypes.map((troop) => {
									const stats = pieceStats(troop, slot, set.pieces[slot]);
									return (
										<td
											key={troop}
											className={`py-2 pe-3 font-mono text-xs ${troop === set.troopType ? "bg-tint" : ""}`}
										>
											{stats && set.pieces[slot].enhancement > 0 ? (
												<span className="flex flex-col px-2">
													<span>
														{t("stat", {
															name: stats.combatStatName.slice(0, 3),
															value: formatNumber(stats.combatStat),
														})}
													</span>
													<span>
														{t("health", {
															value: formatNumber(stats.health),
														})}
													</span>
													<span>
														{t("percentStat", {
															name: stats.percentStatName.slice(0, 4),
															value: formatDecimal(stats.percentStat),
														})}
													</span>
												</span>
											) : (
												<span className="text-muted px-2">{t("none")}</span>
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</ScrollRegion>
			<p className="text-muted text-xs">{t("note", { name: set.name })}</p>
		</Card>
	);
}
