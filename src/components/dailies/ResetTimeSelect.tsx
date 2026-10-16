"use client";

import { useTranslations } from "next-intl";
import { RESET_TIME_OPTIONS } from "@/service/dailies";
import { Select } from "@/comps/ui/Select";
import { useResetTimeLabel } from "./resetTime";

interface ResetTimeSelectProps {
	value: string;
	onChange: (time: string) => void;
}

export function ResetTimeSelect({ value, onChange }: ResetTimeSelectProps) {
	const t = useTranslations("dailies.reset");
	const timeLabel = useResetTimeLabel();

	return (
		<Select
			aria-label={t("label")}
			value={value}
			onChange={(event) => onChange(event.target.value)}
		>
			{RESET_TIME_OPTIONS.map((time) => (
				<option key={time} value={time}>
					{timeLabel(time)}
				</option>
			))}
		</Select>
	);
}
