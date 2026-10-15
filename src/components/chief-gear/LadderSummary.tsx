import { formatCompact, formatNumber } from "@/lib/format";
import type { LadderSummary as Summary } from "@/service/chiefGear";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";

export function LadderSummaryCard({
	summary,
	stepWord,
	onOpenPlan,
}: {
	summary: Summary;
	stepWord: string;
	onOpenPlan: () => void;
}) {
	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h3 className="font-semibold">Left to reach all goals</h3>
				<span className="text-muted font-mono text-xs">Derived</span>
			</div>
			<div className="flex flex-wrap gap-6">
				{[
					[formatNumber(summary.steps), stepWord],
					[formatNumber(summary.scoreToGain), "score"],
					[formatCompact(summary.powerGain), "power gain"],
				].map(([value, label]) => (
					<div key={label} className="flex flex-col">
						<span className="font-mono text-xl">{value}</span>
						<span className="text-muted text-xs">{label}</span>
					</div>
				))}
			</div>
			{summary.materials.length === 0 ? (
				<p className="text-muted">No goals set. Set goals in Plan.</p>
			) : (
				<ul className="flex flex-col">
					{summary.materials.map(({ itemId, amount }) => {
						const item = findItem(itemId);
						return (
							<li
								key={itemId}
								className="border-line flex items-center justify-between gap-3 border-t-[1.5px] py-2 first:border-t-0"
							>
								<span className="flex items-center gap-2">
									<ItemIcon src={item?.img} size={24} />
									{item?.name ?? itemId}
								</span>
								<span className="font-mono">{formatNumber(amount)}</span>
							</li>
						);
					})}
				</ul>
			)}
			<button
				type="button"
				onClick={onOpenPlan}
				className="text-link w-fit font-medium underline"
			>
				Open Plan for event points and a breakdown
			</button>
		</Card>
	);
}
