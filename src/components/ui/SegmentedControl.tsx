"use client";

import { useId } from "react";
import type { ReactNode } from "react";

interface SegmentedControlProps<Value extends string> {
	label: string;
	options: { id: Value; label: string; icon?: ReactNode }[];
	value: Value;
	onChange: (value: Value) => void;
}

export function SegmentedControl<Value extends string>({
	label,
	options,
	value,
	onChange,
}: SegmentedControlProps<Value>) {
	const name = useId();

	return (
		<fieldset className="border-line inline-flex overflow-hidden rounded-md border-[1.5px]">
			<legend className="sr-only">{label}</legend>
			{options.map((option) => (
				<label
					key={option.id}
					className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 px-3 font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-(--ring) lg:min-h-9 ${
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
					{option.icon}
					{option.label}
				</label>
			))}
		</fieldset>
	);
}
