"use client";

import { useId } from "react";

interface TroopSegmentedProps<Value extends string> {
	label: string;
	options: { id: Value; label: string }[];
	value: Value;
	disabled?: boolean;
	onChange: (value: Value) => void;
}

/**
 * A segmented control whose options share the width, so three long names fit a phone.
 */
export function TroopSegmented<Value extends string>({
	label,
	options,
	value,
	disabled = false,
	onChange,
}: TroopSegmentedProps<Value>) {
	const name = useId();

	return (
		<fieldset
			disabled={disabled}
			className="border-line flex w-full overflow-hidden rounded-md border-[1.5px] disabled:opacity-50 lg:w-auto"
		>
			<legend className="sr-only">{label}</legend>
			{options.map((option) => (
				<label
					key={option.id}
					className={`relative flex min-h-11 flex-1 cursor-pointer items-center justify-center px-2 text-center font-medium has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-disabled:cursor-not-allowed has-[:focus-visible]:outline-(--ring) lg:min-h-9 lg:px-3 ${
						option.id === value ? "bg-tint text-ink" : "bg-surface text-muted"
					}`}
				>
					<input
						type="radio"
						name={name}
						value={option.id}
						checked={option.id === value}
						onChange={() => onChange(option.id)}
						className="sr-only"
					/>
					{option.label}
				</label>
			))}
		</fieldset>
	);
}
