import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";
import { stockShortBy } from "@/service/planStock";
import type { StockCheck } from "@/service/planStock";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";

interface PlanStockCheckProps {
	checks: StockCheck[];
	/** The line under the time row. It says which speedups count and how long the plan takes. */
	timeNote: string;
	/** Shown under the time row, such as the share of the general speedups the plan uses. */
	timeExtra?: ReactNode;
}

const unitText = (check: StockCheck, value: number) =>
	`${formatNumber(value)}${check.unit ? ` ${check.unit}` : ""}`;

export function PlanStockCheck({ checks, timeNote, timeExtra }: PlanStockCheckProps) {
	const t = useTranslations("queues.planStock");
	const short = checks.filter((check) => stockShortBy(check) > 0);

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h3 className="font-semibold">{t("title")}</h3>
				<span className="text-muted font-mono text-xs">
					{t("shortCount", {
						short: formatNumber(short.length),
						total: formatNumber(checks.length),
					})}
				</span>
			</div>
			<p className="text-muted">{t("description")}</p>
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
									{enough ? t("enough") : t("notEnough")}
								</Badge>
							</div>
							<ProgressBar
								value={coverage}
								label={t("covered", { name: check.name })}
								tone={enough ? "kept" : "warn"}
							/>
							<div className="flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-xs">
								<span>
									{t("available", { amount: unitText(check, check.available) })}
								</span>
								<span>
									{t("needed", { amount: unitText(check, check.needed) })}
								</span>
								<span className={enough ? "text-kept" : "text-danger"}>
									{enough
										? t("leftOver", {
												amount: unitText(
													check,
													check.available - check.needed
												),
											})
										: t("shortBy", { amount: unitText(check, shortBy) })}
								</span>
							</div>
							{check.detail && <p className="text-muted text-xs">{check.detail}</p>}
							{check.unit && <p className="text-muted text-xs">{timeNote}</p>}
							{check.unit && timeExtra}
						</li>
					);
				})}
			</ul>
			{short.length > 0 && (
				<p className="font-medium">
					{t("stillNeeded", {
						list: short
							.map((check) => `${unitText(check, stockShortBy(check))} ${check.name}`)
							.join(", "),
					})}
				</p>
			)}
			<Link href="/resources" className="text-link w-fit font-medium underline">
				{t("openResources")}
			</Link>
		</Card>
	);
}
