import type { ButtonHTMLAttributes } from "react";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
	label: string;
	compact?: boolean;
}

export function IconButton({
	label,
	compact = false,
	className = "",
	type = "button",
	...props
}: IconButtonProps) {
	const size = compact ? "size-8 lg:size-7" : "size-11 lg:size-9";

	return (
		<button
			type={type}
			aria-label={label}
			className={`inline-flex shrink-0 items-center justify-center rounded-md transition-colors ${size} ${className}`}
			{...props}
		/>
	);
}
