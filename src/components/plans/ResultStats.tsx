export interface ResultStat {
	label: string;
	value: string;
	emphasis?: boolean;
}

/** The numbers that a plan gives, such as the power gained and the time. */
export function ResultStats({ stats }: { stats: ResultStat[] }) {
	return (
		<div className="grid gap-3 sm:grid-cols-2">
			{stats.map(({ label, value, emphasis = false }) => (
				<div key={label} className="bg-tint flex flex-col gap-0.5 rounded-md px-3 py-2">
					<span className="text-muted text-xs">{label}</span>
					<span
						className={`font-mono text-lg font-semibold ${emphasis ? "text-primary" : ""}`}
					>
						{value}
					</span>
				</div>
			))}
		</div>
	);
}
