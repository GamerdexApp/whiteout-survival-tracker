import type { BuildingCalculation } from "whiteout-survival-data";
import Link from "next/link";
import type { Playthrough } from "@/types/app";
import { formatDuration, formatNumber } from "@/lib/format";
import { speedupStock } from "@/service/inventory";
import { resourceChecks, stockShortBy } from "@/service/planStock";
import type { StockCheck } from "@/service/planStock";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";

interface PlanStockCheckProps {
	calculation: BuildingCalculation;
	chief: Playthrough;
	speedPercent: number;
}

const unitText = (check: StockCheck, value: number) =>
	`${formatNumber(value)}${check.unit ? ` ${check.unit}` : ""}`;

export function PlanStockCheck({ calculation, chief, speedPercent }: PlanStockCheckProps) {
	const checks = resourceChecks(calculation, chief);
	const short = checks.filter((check) => stockShortBy(check) > 0);
	const stock = speedupStock(chief);
	const minutesOf = (type: string) => stock.find((entry) => entry.type === type)?.minutes ?? 0;

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h3 className="font-semibold">Do you have enough?</h3>
				<span className="text-muted font-mono text-xs">
					{short.length} of {checks.length} short
				</span>
			</div>
			<p className="text-muted">
				What the plan takes from your stock, checked against what you hold. The full plan is
				in the result below.
			</p>
			<ul className="flex flex-col">
				{checks.map((check) => {
					const shortBy = stockShortBy(check);
					const enough = shortBy === 0;
					const coverage = check.needed === 0 ? 1 : check.available / check.needed;
					return (
						<li
							key={check.id}
							className="border-line flex flex-col gap-1.5 border-t-[1.5px] py-3 first:border-t-0"
						>
							<div className="flex items-center justify-between gap-3">
								<span className="font-medium">{check.name}</span>
								<Badge tone={enough ? "kept" : "changed"}>
									{enough ? "Enough" : "Not enough"}
								</Badge>
							</div>
							<ProgressBar
								value={coverage}
								label={`${check.name} covered`}
								tone={enough ? "kept" : "warn"}
							/>
							<div className="flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-xs">
								<span>Available {unitText(check, check.available)}</span>
								<span>Needed {unitText(check, check.needed)}</span>
								<span className={enough ? "text-kept" : "text-danger"}>
									{enough
										? `${unitText(check, check.available - check.needed)} left over`
										: `Short by ${unitText(check, shortBy)}`}
								</span>
							</div>
							{check.unit && (
								<p className="text-muted text-xs">
									The plan takes {formatDuration(calculation.seconds)} after the{" "}
									{speedPercent}% speed bonus. Your stock: Construction{" "}
									{formatNumber(minutesOf("construction"))} min, General{" "}
									{formatNumber(minutesOf("general"))} min. General speedups count
									toward construction.
								</p>
							)}
						</li>
					);
				})}
			</ul>
			{short.length > 0 && (
				<p className="font-medium">
					Still needed for the full plan:{" "}
					{short
						.map((check) => `${unitText(check, stockShortBy(check))} ${check.name}`)
						.join(", ")}
					.
				</p>
			)}
			<Link href="/resources" className="text-link w-fit font-medium underline">
				Open Resources
			</Link>
		</Card>
	);
}
