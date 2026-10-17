"use client";

import { useState } from "react";
import { formatDecimal } from "@/lib/format";
import { Input } from "@/comps/ui/Input";

interface PercentInputProps {
	value: number;
	max: number;
	onCommit: (value: number) => void;
}

const FRACTION_DIGITS = 2;

const decimalTextOf = (text: string) => {
	const [whole, ...rest] = text
		.replace(",", ".")
		.replace(/[^\d.]/g, "")
		.split(".");
	return rest.length === 0 ? whole : `${whole}.${rest.join("").slice(0, FRACTION_DIGITS)}`;
};

/**
 * A percent with up to two decimals. It shows the player's number format and switches to plain
 * text while focused. A comma or a point is the decimal mark, because both formats are in use.
 */
export function PercentInput({ value, max, onCommit }: PercentInputProps) {
	const [draft, setDraft] = useState<string | null>(null);

	const commit = () => {
		if (draft === null) return;
		setDraft(null);
		const next = Math.min(max, Number(draft) || 0);
		if (next !== value) onCommit(next);
	};

	return (
		<Input
			type="text"
			inputMode="decimal"
			value={draft ?? formatDecimal(value, FRACTION_DIGITS)}
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
