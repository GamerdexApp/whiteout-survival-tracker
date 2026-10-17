import { useTranslations } from "next-intl";
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
	const t = useTranslations("chiefGear.summary");
	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h2 className="font-semibold">{t("title")}</h2>
				<span className="text-muted font-mono text-xs">{t("derived")}</span>
			</div>
			<div className="flex flex-wrap gap-6">
				{[
					[formatNumber(summary.steps), stepWord],
					[formatNumber(summary.scoreToGain), t("score")],
					[formatCompact(summary.powerGain), t("powerGain")],
				].map(([value, label]) => (
					<div key={label} className="flex flex-col">
						<span className="font-mono text-xl">{value}</span>
						<span className="text-muted text-xs">{label}</span>
					</div>
				))}
			</div>
			{summary.materials.length === 0 ? (
				<p className="text-muted">{t("noGoals")}</p>
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
				className="text-link inline-flex min-h-11 w-fit items-center font-medium underline lg:min-h-9"
			>
				{t("openPlan")}
			</button>
		</Card>
	);
}
