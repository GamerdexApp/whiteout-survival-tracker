"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { bannerRows } from "@/service/alliance";
import { BANNER_RESOURCE_IDS } from "@/data/game/alliance";
import { findItem } from "@/data/game/items";
import { Card } from "@/comps/ui/Card";
import { ScrollRegion } from "@/comps/ui/ScrollRegion";

const stateTone = {
	built: "text-kept",
	current: "text-primary",
	notBuilt: "text-muted",
} as const;

export function BannerTable({ chief }: { chief: Playthrough }) {
	const t = useTranslations("alliance.table");
	const rows = bannerRows(chief);
	const scrollRef = useRef<HTMLDivElement>(null);
	const currentRef = useRef<HTMLTableRowElement>(null);

	useEffect(() => {
		const container = scrollRef.current;
		const row = currentRef.current;
		if (container && row)
			container.scrollTop = Math.max(0, row.offsetTop - container.clientHeight / 2);
	}, []);

	return (
		<Card className="overflow-hidden">
			<div className="flex flex-wrap items-baseline justify-between gap-2 p-4">
				<h2 className="font-semibold">{t("title")}</h2>
				<span className="text-muted font-mono text-xs">
					{t("note", { count: formatNumber(rows.length) })}
				</span>
			</div>
			<ScrollRegion
				ref={scrollRef}
				label={t("title")}
				className="relative max-h-[32rem] overflow-auto"
			>
				<table className="w-full min-w-[34rem] border-collapse text-left">
					<thead className="bg-surface sticky top-0">
						<tr className="border-line text-muted border-y-[1.5px] font-mono text-xs uppercase">
							<th className="px-4 py-2 font-medium">{t("range")}</th>
							{BANNER_RESOURCE_IDS.map((id) => (
								<th key={id} className="px-4 py-2 font-medium">
									{findItem(id)?.name ?? id}
								</th>
							))}
							<th className="px-4 py-2 font-medium">{t("state")}</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr
								key={row.id}
								ref={row.state === "current" ? currentRef : undefined}
								aria-current={row.state === "current" ? "true" : undefined}
								className={`border-line border-b-[1.5px] last:border-b-0 ${row.state === "current" ? "bg-tint" : ""}`}
							>
								<th scope="row" className="px-4 py-2.5 font-semibold">
									{row.name}
								</th>
								{row.cells.map((cell, index) => (
									<td key={cell.itemId} className="px-4 py-2.5 font-mono">
										{cell.amount === null ? (
											<span className="text-muted">
												{row.free && index === 0 ? t("noCost") : t("none")}
											</span>
										) : (
											formatNumber(cell.amount)
										)}
									</td>
								))}
								<td className={`px-4 py-2.5 font-semibold ${stateTone[row.state]}`}>
									{t(row.state)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</ScrollRegion>
		</Card>
	);
}
