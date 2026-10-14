import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	highlighted?: boolean;
}

export function Card({ highlighted = false, className = "", ...props }: CardProps) {
	return (
		<div
			className={`bg-surface rounded-md border-[1.5px] ${highlighted ? "border-primary" : "border-line"} ${className}`}
			{...props}
		/>
	);
}
