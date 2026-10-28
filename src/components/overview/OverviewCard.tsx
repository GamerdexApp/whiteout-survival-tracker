import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/comps/ui/Card";

interface OverviewCardProps {
	title: string;
	linkLabel?: string;
	href?: string;
	badge?: ReactNode;
	/** An icon at the start of the title. */
	icon?: ReactNode;
	className?: string;
	children: ReactNode;
}

export function OverviewCard({
	title,
	linkLabel,
	href,
	badge,
	icon,
	className = "",
	children,
}: OverviewCardProps) {
	return (
		<Card className={`flex flex-col gap-3 p-4 lg:p-5 ${className}`}>
			<header className="flex items-center justify-between gap-3">
				<h2 className="flex min-w-0 items-center gap-2 text-lg font-semibold">
					{icon}
					{title}
				</h2>
				{badge}
				{href && linkLabel && (
					<Link
						href={href}
						className="text-link inline-flex min-h-11 min-w-11 items-center justify-center underline lg:min-h-9 lg:min-w-9"
					>
						{linkLabel}
					</Link>
				)}
			</header>
			{children}
		</Card>
	);
}

export function CountBadge({ children }: { children: ReactNode }) {
	return (
		<span className="bg-tint border-line text-link rounded-full border-[1.5px] px-2.5 py-0.5 font-mono text-xs">
			{children}
		</span>
	);
}
