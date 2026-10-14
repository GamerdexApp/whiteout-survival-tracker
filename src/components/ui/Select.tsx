import type { SelectHTMLAttributes } from "react";
import { LuChevronDown } from "react-icons/lu";
import { controlBorder, controlClasses, controlHeightClasses, useFieldControl } from "./Field";

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
	const field = useFieldControl();

	return (
		<span className="relative block">
			<select
				id={field?.id}
				aria-describedby={field?.describedBy}
				aria-invalid={field?.invalid || undefined}
				className={`${controlClasses} ${controlHeightClasses} ${controlBorder(field?.invalid ?? false)} appearance-none pr-9 pl-3 ${className}`}
				{...props}
			/>
			<LuChevronDown
				size={16}
				aria-hidden="true"
				className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
			/>
		</span>
	);
}
