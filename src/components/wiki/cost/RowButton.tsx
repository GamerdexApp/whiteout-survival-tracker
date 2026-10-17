import type { ReactNode } from "react";

export function RowButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
	return (
		<button
			type="button"
			aria-haspopup="dialog"
			onClick={onClick}
			className="flex min-h-11 min-w-11 items-center gap-2 text-left font-semibold hover:underline lg:min-h-9 lg:min-w-9"
		>
			{children}
		</button>
	);
}
