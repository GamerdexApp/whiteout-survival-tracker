"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { dayLabelOf } from "@/service/coreEvents";
import { earnablePointsOf } from "@/service/eventExport";
import type { ExportSpec } from "@/service/eventExport";
import { Card } from "@/comps/ui/Card";

/**
 * The points that a plan scores in each core event, on the day of the event that scores the most.
 * It shows nothing when no event scores the plan.
 */
export function EarnablePoints({ chief, spec }: { chief: Playthrough; spec: ExportSpec }) {
	const t = useTranslations("eventExport");
	const earnable = earnablePointsOf(chief, spec);

	if (earnable.length === 0) return null;

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex flex-col gap-1">
				<h3 className="font-semibold">{t("earnable.title")}</h3>
				<p className="text-muted text-xs">{t("earnable.description")}</p>
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{earnable.map(({ event, total, days }) => (
					<div
						key={event}
						className="border-line flex flex-col gap-2 rounded-md border-[1.5px] p-3"
					>
						<div className="flex items-baseline justify-between gap-3">
							<span className="font-semibold">{t(`events.${event}`)}</span>
							<span className="font-mono text-lg font-semibold">
								{formatNumber(total)}
							</span>
						</div>
						{days.map((day) => (
							<div key={day.groupId} className="flex flex-col gap-0.5">
								<span className="text-muted text-xs">
									{`${dayLabelOf(event, day.dayId)} ${day.dayName}`}
								</span>
								{day.lines.map(({ line, row, points }) => (
									<span
										key={line.id}
										className="flex justify-between gap-3 text-xs"
									>
										<span>
											{t("earnable.line", {
												label: line.label,
												units: formatNumber(line.units),
												each: formatNumber(row?.points ?? 0),
											})}
										</span>
										<span className="font-mono">{formatNumber(points)}</span>
									</span>
								))}
							</div>
						))}
					</div>
				))}
			</div>
		</Card>
	);
}
