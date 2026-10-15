import type { ReactNode } from "react";
import { Card } from "./Card";

interface StatTileProps {
	value: ReactNode;
	label: string;
	emphasis?: boolean;
}

export function StatTile({ value, label, emphasis = false }: StatTileProps) {
	return (
		<Card className="flex flex-col gap-1 px-4 py-3">
			<span className={`font-mono text-2xl ${emphasis ? "text-primary" : "text-ink"}`}>
				{value}
			</span>
			<span className="text-muted">{label}</span>
		</Card>
	);
}
