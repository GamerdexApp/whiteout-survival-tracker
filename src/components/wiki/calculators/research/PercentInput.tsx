"use client";

import { useState } from "react";
import { formatDecimal } from "@/lib/format";
import { Input } from "@/comps/ui/Input";

interface PercentInputProps {
	value: number;
	max: number;
	onCommit: (value: number) => void;
}

const decimalTextOf = (text: string) => text.replace(",", ".").replace(/[^\d.]/g, "");

/**
 * A decimal version of CountInput: the player's number format while not focused, plain digits
 * while focused, and the value is committed on blur. A comma or a point is the decimal separator.
 */
export function PercentInput({ value, max, onCommit }: PercentInputProps) {
	const [draft, setDraft] = useState<string | null>(null);

	const commit = () => {
		if (draft === null) return;
		setDraft(null);
		const parsed = Number.parseFloat(draft);
		const next = Number.isNaN(parsed) ? 0 : Math.min(max, parsed);
		if (next !== value) onCommit(next);
	};

	return (
		<Input
			type="text"
			inputMode="decimal"
			value={draft ?? formatDecimal(value)}
			onFocus={(event) => {
				const field = event.currentTarget;
				setDraft(String(value));
				queueMicrotask(() => field.select());
			}}
			onChange={(event) => setDraft(decimalTextOf(event.target.value))}
			onBlur={commit}
			onKeyDown={(event) => {
				if (event.key === "Enter") event.currentTarget.blur();
			}}
			className="text-end font-mono"
		/>
	);
}
