import type { HeroGearSet } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { allTroopTypes, pieceStats, slotIds, slotName, troopLabel } from "@/service/heroGear";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";

export function GearStatLines({ set }: { set: HeroGearSet }) {
	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">Stat lines, 4 slots by 3 troop types</h3>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[34rem] text-left">
					<thead>
						<tr>
							<th className="w-24" />
							{allTroopTypes.map((troop) => (
								<th key={troop} className="py-1 pr-3">
									<SectionLabel
										className={
											troop === set.troopType ? "text-primary" : "text-muted"
										}
									>
										{troopLabel(troop)}
										{troop === set.troopType ? " (this set)" : ""}
									</SectionLabel>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{slotIds.map((slot) => (
							<tr key={slot} className="border-line border-t-[1.5px] align-top">
								<th scope="row" className="py-2 pr-3 font-semibold">
									{slotName(slot)}
								</th>
								{allTroopTypes.map((troop) => {
									const stats = pieceStats(troop, slot, set.pieces[slot]);
									return (
										<td
											key={troop}
											className={`py-2 pr-3 font-mono text-xs ${troop === set.troopType ? "bg-tint" : ""}`}
										>
											{stats && set.pieces[slot].enhancement > 0 ? (
												<span className="flex flex-col px-2">
													<span>
														{stats.combatStatName.slice(0, 3)}{" "}
														{formatNumber(stats.combatStat)}
													</span>
													<span>HP {formatNumber(stats.health)}</span>
													<span>
														{stats.percentStatName.slice(0, 4)}{" "}
														{stats.percentStat}%
													</span>
												</span>
											) : (
												<span className="text-muted px-2">None</span>
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p className="text-muted text-xs">
				Values at the piece levels of {set.name}, including mastery forging, rounded down.
				Stats come from WoS Tools, which stops at 192 of the 200 levels. The highlighted
				column is the troop type of the set.
			</p>
		</Card>
	);
}
