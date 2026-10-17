import type { ChiefGearLevel } from "@/data/game/calcChiefGear";
import { Field } from "@/comps/ui/Field";
import { Select } from "@/comps/ui/Select";
import { useLevelName } from "./useLevelName";

const NONE = "";

interface LevelSelectProps {
	label: string;
	ariaLabel?: string;
	noneLabel: string;
	levels: ChiefGearLevel[];
	value: string | null;
	onChange: (levelId: string | null) => void;
}

export function LevelSelect({
	label,
	ariaLabel,
	noneLabel,
	levels,
	value,
	onChange,
}: LevelSelectProps) {
	const levelName = useLevelName();

	return (
		<Field label={label}>
			<Select
				aria-label={ariaLabel}
				value={value ?? NONE}
				onChange={(event) =>
					onChange(event.target.value === NONE ? null : event.target.value)
				}
			>
				<option value={NONE}>{noneLabel}</option>
				{levels.map((level) => (
					<option key={level.id} value={level.id}>
						{levelName(level)}
					</option>
				))}
			</Select>
		</Field>
	);
}
