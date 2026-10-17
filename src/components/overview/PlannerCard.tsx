import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { plannerSummaryOf } from "@/service/overviewPlanner";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { CountBadge, OverviewCard } from "./OverviewCard";

export function PlannerCard({ chief, className }: { chief: Playthrough; className?: string }) {
	const t = useTranslations("overview.planner");
	const summary = useMemo(() => plannerSummaryOf(chief), [chief]);
	const hasGoals = summary.pages.length > 0;

	return (
		<OverviewCard
			title={t("title")}
			className={className}
			badge={
				hasGoals && (
					<CountBadge>
						{summary.shortCount > 0
							? t("short", { amount: formatNumber(summary.shortCount) })
							: t("covered")}
					</CountBadge>
				)
			}
		>
			<p className="text-muted">
				{hasGoals
					? t("goals", {
							pages: summary.pages
								.map((page) => t(`pages.${page}`))
								.join(t("separator")),
						})
					: t("noGoals")}
			</p>
			<ul className="divide-line border-line divide-y-[1.5px] border-t-[1.5px]">
				{summary.rows.map((row) => (
					<li key={row.itemId} className="flex min-h-11 items-center gap-3 py-2">
						<ItemIcon src={row.img} size={28} />
						<span className="flex min-w-0 flex-1 flex-col">
							<span className="font-semibold">{row.name}</span>
							<span className="text-muted font-mono text-xs">
								{t("line", {
									need: formatNumber(row.need),
									have: formatNumber(row.have),
								})}
							</span>
						</span>
						<span
							className={`text-end font-mono text-sm ${row.short > 0 ? "text-danger" : "text-kept"}`}
						>
							{row.short > 0
								? t("shortBy", { amount: formatNumber(row.short) })
								: t("enough")}
						</span>
					</li>
				))}
			</ul>
			{summary.incomplete && <Note tone="warning">{t("incomplete")}</Note>}
			<Link
				href="/resources"
				className="text-link inline-flex min-h-11 items-center self-start underline lg:min-h-9"
			>
				{t("updateStock")}
			</Link>
		</OverviewCard>
	);
}
