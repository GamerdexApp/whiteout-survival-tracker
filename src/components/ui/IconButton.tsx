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
	// A compact button keeps its look and gets a 44 px touch area on small screens.
	const size = compact
		? "relative size-8 lg:size-7 max-lg:z-[1] max-lg:before:absolute max-lg:before:-inset-2 max-lg:before:content-['']"
		: "size-11 lg:size-9";

	return (
		<button
			type={type}
			aria-label={label}
			className={`inline-flex shrink-0 items-center justify-center rounded-md transition-colors ${size} ${className}`}
			{...props}
		/>
	);
}
