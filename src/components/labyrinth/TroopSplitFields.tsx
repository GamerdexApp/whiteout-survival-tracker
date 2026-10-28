import { useTranslations } from "next-intl";
import type { LabyrinthTroopSplit, LabyrinthTroopType } from "@/types/app";
import { formatNumber } from "@/lib/format";
import {
	isSplitValid,
	splitTotalOf,
	TROOP_SPLIT_TOTAL,
	TROOP_TYPES,
} from "@/service/labyrinthFormations";
import { CountInput } from "@/comps/troops/CountInput";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface TroopSplitFieldsProps {
	split: LabyrinthTroopSplit;
	onChange: (split: LabyrinthTroopSplit) => void;
}

export function TroopSplitFields({ split, onChange }: TroopSplitFieldsProps) {
	const t = useTranslations("labyrinth.formations");
	const total = splitTotalOf(split);

	const change = (type: LabyrinthTroopType, percent: number) =>
		onChange({ ...split, [type]: percent });

	return (
		<div className="flex flex-col gap-2">
			<div className="grid grid-cols-3 gap-3">
				{TROOP_TYPES.map((type) => (
					<div key={type} className="flex min-w-0 flex-col gap-1.5">
						<SectionLabel className="text-muted">
							{t(`troopTypes.${type}`)}
						</SectionLabel>
						<CountInput
							label={t("percentLabel", { type: t(`troopTypes.${type}`) })}
							value={split[type]}
							max={TROOP_SPLIT_TOTAL}
							onCommit={(percent) => change(type, percent)}
						/>
					</div>
				))}
			</div>
			<span
				className={`font-mono text-sm ${isSplitValid(split) ? "text-muted" : "text-danger font-medium"}`}
			>
				{isSplitValid(split)
					? t("total", { total: formatNumber(total) })
					: t("totalWrong", {
							total: formatNumber(total),
							needed: formatNumber(TROOP_SPLIT_TOTAL),
						})}
			</span>
		</div>
	);
}
