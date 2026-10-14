"use client";

import { useId } from "react";
import type { ReactNode } from "react";

interface SwitchRowProps {
	label: string;
	description?: ReactNode;
	checked: boolean;
	onChange: (checked: boolean) => void;
}

export function SwitchRow({ label, description, checked, onChange }: SwitchRowProps) {
	const labelId = useId();
	const descriptionId = useId();

	return (
		<div className="flex items-start justify-between gap-4 py-3">
			<div className="flex min-w-0 flex-col gap-1">
				<span id={labelId} className="font-medium">
					{label}
				</span>
				{description && (
					<span id={descriptionId} className="text-muted">
						{description}
					</span>
				)}
			</div>
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				aria-labelledby={labelId}
				aria-describedby={description ? descriptionId : undefined}
				onClick={() => onChange(!checked)}
				className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border-[1.5px] transition-colors ${
					checked ? "border-primary bg-primary" : "border-line bg-track"
				}`}
			>
				<span
					aria-hidden="true"
					className={`absolute top-0.5 size-5 rounded-full transition-all ${
						checked ? "bg-on-primary left-[22px]" : "bg-muted left-0.5"
					}`}
				/>
				<span className="sr-only">{checked ? "On" : "Off"}</span>
			</button>
		</div>
	);
}
