"use client";

import { useTranslations } from "next-intl";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";

interface HoursMinutesFieldsProps {
	hours: string;
	minutes: string;
	hoursLabel?: string;
	onChange: (hours: string, minutes: string) => void;
}

const digits = (value: string) => value.replace(/\D/g, "").slice(0, 4);

export function HoursMinutesFields({
	hours,
	minutes,
	hoursLabel,
	onChange,
}: HoursMinutesFieldsProps) {
	const t = useTranslations("queues.hoursMinutes");

	return (
		<div className="grid grid-cols-2 gap-3">
			<Field label={hoursLabel ?? t("hours")}>
				<Input
					inputMode="numeric"
					className="text-end"
					value={hours}
					onChange={(event) => onChange(digits(event.target.value), minutes)}
				/>
			</Field>
			<Field label={t("minutes")}>
				<Input
					inputMode="numeric"
					className="text-end"
					value={minutes}
					onChange={(event) => onChange(hours, digits(event.target.value))}
				/>
			</Field>
		</div>
	);
}
