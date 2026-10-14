import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={`border-line bg-surface rounded-md border-[1.5px] ${className}`}
			{...props}
		/>
	);
}
