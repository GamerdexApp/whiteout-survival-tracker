"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/format";
import { Input } from "@/comps/ui/Input";

interface CountInputProps {
	label?: string;
	value: number | null;
	min?: number;
	max: number;
	/** The text shown while the field is not focused and the value is null. */
	emptyText?: string;
	className?: string;
	dashed?: boolean;
	onCommit: (value: number) => void;
}

const digitsOf = (text: string) => text.replace(/\D/g, "");

/**
 * Shows the value with the number format of the player and switches to plain digits while the
 * field has focus. The change is committed when the field loses focus.
 */
export function CountInput({
	label,
	value,
	min = 0,
	max,
	emptyText = "",
	className = "",
	dashed = false,
	onCommit,
}: CountInputProps) {
	const [draft, setDraft] = useState<string | null>(null);

	const commit = () => {
		if (draft === null) return;
		setDraft(null);
		if (draft === "" && value === null) return;
		const next = Math.min(max, Math.max(min, Number(draft || 0)));
		if (next !== value) onCommit(next);
	};

	return (
		<Input
			type="text"
			inputMode="numeric"
			aria-label={label}
			value={draft ?? (value === null ? emptyText : formatNumber(value))}
			onFocus={(event) => {
				const field = event.currentTarget;
				setDraft(value === null ? "" : String(value));
				queueMicrotask(() => field.select());
			}}
			onChange={(event) => setDraft(digitsOf(event.target.value))}
			onBlur={commit}
			onKeyDown={(event) => {
				if (event.key === "Enter") event.currentTarget.blur();
			}}
			className={`text-end font-mono ${dashed ? "bg-tint border-dashed" : ""} ${className}`}
		/>
	);
}
