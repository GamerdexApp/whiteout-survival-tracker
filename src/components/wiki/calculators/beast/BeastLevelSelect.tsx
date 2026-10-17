"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { beastLevelBandOf, beastLevelBands } from "@/data/game/calcBeast";
import { Select } from "@/comps/ui/Select";

/** Returns a function that names the level band of a beast level, such as "Level 1 to 10". */
export function useBeastLevelBandName() {
	const t = useTranslations("calcBeast");

	return (level: number) => {
		const band = beastLevelBandOf(level);
		return t("levelBand", { low: formatNumber(band.low), high: formatNumber(band.high) });
	};
}

export function BeastLevelSelect({
	level,
	onChange,
}: {
	level: number;
	onChange: (level: number) => void;
}) {
	const bandName = useBeastLevelBandName();

	return (
		<Select
			value={String(beastLevelBandOf(level).low)}
			onChange={(event) => onChange(Number(event.target.value))}
		>
			{beastLevelBands.map((band) => (
				<option key={band.low} value={band.low}>
					{bandName(band.low)}
				</option>
			))}
		</Select>
	);
}
