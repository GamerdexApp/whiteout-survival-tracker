"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/format";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";

interface NumberFieldProps {
	label: string;
	value: number | undefined;
	onChange: (value: number | undefined) => void;
	hint?: string;
	optional?: boolean;
	error?: string;
}

/** The text stays as typed while the field has focus and shows the formatted number on blur. */
export function NumberField({ label, value, onChange, hint, optional, error }: NumberFieldProps) {
	const [typed, setTyped] = useState<string | null>(null);

	const type = (text: string) => {
		const digits = text.replace(/\D/g, "");
		setTyped(digits);
		onChange(digits === "" ? undefined : Number(digits));
	};

	return (
		<Field label={label} hint={hint} optional={optional} error={error}>
			<Input
				inputMode="numeric"
				className="font-mono"
				value={typed ?? (value === undefined ? "" : formatNumber(value))}
				onChange={(event) => type(event.target.value)}
				onBlur={() => setTyped(null)}
			/>
		</Field>
	);
}
