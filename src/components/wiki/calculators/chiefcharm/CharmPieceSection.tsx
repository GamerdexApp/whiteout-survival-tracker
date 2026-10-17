"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { CharmChoice, CharmChoices } from "@/service/calcChiefCharm";
import { charmRows, levelNumberOf } from "@/service/calcChiefCharm";
import { charmImageOf } from "@/data/game/calcChiefCharm";
import type { ChiefGearSlot } from "@/data/game/calcChiefCharm";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { CharmRangeFields } from "./CharmRangeFields";

interface CharmPieceSectionProps {
	piece: ChiefGearSlot;
	choices: CharmChoices;
	onChange: (key: string, choice: CharmChoice) => void;
}

export function CharmPieceSection({ piece, choices, onChange }: CharmPieceSectionProps) {
	const t = useTranslations("calcChiefCharm.charms");
	const rows = charmRows.filter((row) => row.piece.id === piece.id);

	return (
		<section className="border-line border-t-[1.5px] first:border-t-0">
			<div className="bg-tint flex items-center justify-between gap-3 px-4 py-2">
				<h3 className="font-semibold">{piece.name}</h3>
				<span className="text-muted font-mono text-xs">{piece.troopType}</span>
			</div>
			<ul>
				{rows.map((row) => {
					const choice = choices[row.key];
					const charmName = t("charmName", {
						piece: piece.name,
						number: formatNumber(row.number),
					});
					return (
						<li
							key={row.key}
							className="border-line grid gap-3 border-t-[1.5px] px-4 py-3 sm:grid-cols-[10rem_1fr_1fr] sm:items-end"
						>
							<span className="flex items-center gap-2 font-medium sm:min-h-9">
								<ItemIcon
									src={charmImageOf(piece, levelNumberOf(choice))}
									size={32}
								/>
								{t("charmLabel", { number: formatNumber(row.number) })}
							</span>
							<div className="grid grid-cols-2 gap-3 sm:contents">
								<CharmRangeFields
									choice={choice}
									fromLabel={t("fromLabel")}
									toLabel={t("toLabel")}
									fromName={t("fromName", { charm: charmName })}
									toName={t("toName", { charm: charmName })}
									onChange={(next) => onChange(row.key, next)}
								/>
							</div>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
