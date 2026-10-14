import type { ButtonHTMLAttributes } from "react";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
	label: string;
}

export function IconButton({ label, className = "", type = "button", ...props }: IconButtonProps) {
	return (
		<button
			type={type}
			aria-label={label}
			className={`inline-flex size-11 shrink-0 items-center justify-center rounded-md transition-colors lg:size-9 ${className}`}
			{...props}
		/>
	);
}
