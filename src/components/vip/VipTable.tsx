"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { MAX_VIP_XP, vipRows } from "@/service/vip";
import type { VipRow } from "@/service/vip";
import { MAX_VIP_LEVEL } from "@/data/game/vip";
import { Card } from "@/comps/ui/Card";

const stateTone = {
	reached: "text-kept",
	current: "text-primary",
	ahead: "text-muted",
	unknown: "text-muted",
} as const;

const bonusText = (row: VipRow) =>
	row.newOrHigher.map((bonus) => `${bonus.stat} ${bonus.value}`).join(", ");

export function VipTable({ chief }: { chief: Playthrough }) {
	const t = useTranslations("vip.table");
	const rows = vipRows(chief);

	return (
		<Card className="overflow-hidden">
			<h2 className="p-4 font-semibold">
				{t("title", {
					count: formatNumber(MAX_VIP_LEVEL),
					total: formatNumber(MAX_VIP_XP),
				})}
			</h2>
			<table className="w-full border-collapse text-left max-lg:hidden">
				<thead>
					<tr className="border-line text-muted border-y-[1.5px] font-mono text-xs uppercase">
						<th className="px-4 py-2 font-medium">{t("level")}</th>
						<th className="px-4 py-2 font-medium">{t("xpFromLast")}</th>
						<th className="px-4 py-2 font-medium">{t("totalXp")}</th>
						<th className="px-4 py-2 font-medium">{t("bonuses")}</th>
						<th className="px-4 py-2 font-medium">{t("state")}</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr
							key={row.level}
							aria-current={row.state === "current" ? "true" : undefined}
							className={`border-line border-b-[1.5px] last:border-b-0 ${row.state === "current" ? "bg-tint" : ""}`}
						>
							<th scope="row" className="px-4 py-2.5 font-semibold whitespace-nowrap">
								{t("levelName", { level: formatNumber(row.level) })}
							</th>
							<td className="px-4 py-2.5 font-mono">
								{row.xpFromLast === null ? (
									<span className="text-muted">{t("unknown")}</span>
								) : (
									formatNumber(row.xpFromLast)
								)}
							</td>
							<td className="px-4 py-2.5 font-mono">{formatNumber(row.totalXp)}</td>
							<td className="px-4 py-2.5">{bonusText(row)}</td>
							<td className={`px-4 py-2.5 font-semibold ${stateTone[row.state]}`}>
								{t(`states.${row.state}`)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<ul className="lg:hidden">
				{rows.map((row) => (
					<li
						key={row.level}
						aria-current={row.state === "current" ? "true" : undefined}
						className={`border-line flex flex-col gap-1 border-t-[1.5px] px-4 py-3 ${row.state === "current" ? "bg-tint" : ""}`}
					>
						<div className="flex items-center justify-between gap-3">
							<span className="font-semibold">
								{t("levelName", { level: formatNumber(row.level) })}
							</span>
							<span className={`text-xs font-semibold ${stateTone[row.state]}`}>
								{t(`states.${row.state}`)}
							</span>
						</div>
						<span className="text-muted font-mono text-xs">
							{t("xpFromLastMobile", {
								xp:
									row.xpFromLast === null
										? t("unknown")
										: formatNumber(row.xpFromLast),
							})}
							{" · "}
							{t("totalMobile", { xp: formatNumber(row.totalXp) })}
						</span>
						<span>{bonusText(row)}</span>
					</li>
				))}
			</ul>
		</Card>
	);
}
