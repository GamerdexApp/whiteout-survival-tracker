import { useTranslations } from "next-intl";
import { LuMinus, LuPlus } from "react-icons/lu";
import type { CoreEventId, Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import type { EventDay, EventResult } from "@/service/coreEvents";
import {
	countOf,
	dayLabelOf,
	dayNoteOf,
	dayTotalOf,
	importedCountOf,
	manualCountOf,
	scoringRowsOf,
} from "@/service/coreEvents";
import { CountInput } from "@/comps/troops/CountInput";
import { Card } from "@/comps/ui/Card";
import { IconButton } from "@/comps/ui/IconButton";

const MAX_COUNT = 99_999_999;
const ROW_GRID = "grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-1 px-4 py-3";
const DESKTOP_GRID = "lg:grid-cols-[minmax(0,1fr)_100px_170px_110px]";
const BUTTON_CLASSES = "border-line bg-surface hover:bg-tint border-[1.5px]";

interface ActionTableProps {
	chief: Playthrough;
	event: CoreEventId;
	day: EventDay;
	result: EventResult;
	onCount: (action: string, total: number) => void;
}

export function ActionTable({ chief, event, day, result, onCount }: ActionTableProps) {
	const t = useTranslations("coreEvents.table");
	const rows = scoringRowsOf(event, day.id, chief);
	const note = dayNoteOf(event, day.id, chief);
	const dayResult = result.days.find((item) => item.id === day.id);

	return (
		<Card className="overflow-hidden">
			<div className="flex items-start justify-between gap-3 p-4">
				<div className="flex flex-col">
					<h2 className="font-semibold">
						{t("title", { day: dayLabelOf(event, day.id), name: day.name })}
					</h2>
					{day.phase && (
						<span className="text-muted">
							{day.phase === "battle" ? t("phaseBattle") : t("phasePreparation")}
						</span>
					)}
				</div>
				<span className="font-mono font-semibold">
					{formatNumber(dayTotalOf(result, day.id))}
				</span>
			</div>
			{note && <p className="text-muted px-4 pb-3">{note}</p>}
			<div
				className={`border-line text-muted border-y-[1.5px] font-mono text-[11px] tracking-[0.08em] uppercase max-lg:hidden ${ROW_GRID} ${DESKTOP_GRID}`}
			>
				<span>{t("action")}</span>
				<span className="text-right">{t("pointsEach")}</span>
				<span className="text-center">{t("count")}</span>
				<span className="text-right">{t("points")}</span>
			</div>
			<ul>
				{rows.map((row) => {
					const count = countOf(chief, event, day.id, row.action);
					const imported = importedCountOf(chief, event, day.id, row.action);
					const manual = manualCountOf(chief, event, day.id, row.action);
					return (
						<li
							key={row.action}
							className={`border-line border-t-[1.5px] first:border-t-0 ${ROW_GRID} ${DESKTOP_GRID}`}
						>
							<div className="col-span-3 flex flex-col gap-1 lg:col-span-1">
								<span>{row.action}</span>
								{row.noBonus && (
									<span className="border-line text-muted w-fit rounded-full border-[1.5px] px-2 font-mono text-[11px]">
										{t("noDawnHymn")}
									</span>
								)}
							</div>
							<span className="text-muted lg:text-ink font-mono text-sm lg:text-right lg:text-base">
								{formatNumber(row.points)}
							</span>
							<div className="flex flex-col items-center gap-1">
								<div className="flex items-center gap-1">
									<IconButton
										compact
										label={t("lower", { action: row.action })}
										disabled={manual === 0}
										onClick={() => onCount(row.action, count - 1)}
										className={BUTTON_CLASSES}
									>
										<LuMinus size={14} aria-hidden="true" />
									</IconButton>
									<div className="w-24">
										<CountInput
											label={t("countLabel", { action: row.action })}
											value={count}
											max={MAX_COUNT}
											onCommit={(value) => onCount(row.action, value)}
										/>
									</div>
									<IconButton
										compact
										label={t("raise", { action: row.action })}
										onClick={() => onCount(row.action, count + 1)}
										className={BUTTON_CLASSES}
									>
										<LuPlus size={14} aria-hidden="true" />
									</IconButton>
								</div>
								{imported > 0 && (
									<span className="text-muted text-xs">
										{t("fromPlans", { amount: formatNumber(imported) })}
									</span>
								)}
							</div>
							<span className="text-right font-mono font-semibold">
								{formatNumber(count * row.points)}
							</span>
						</li>
					);
				})}
			</ul>
			<div className="border-line text-muted flex justify-end gap-6 border-t-[1.5px] px-4 py-3 font-mono text-sm">
				<span>{t("base", { amount: formatNumber(dayResult?.base ?? 0) })}</span>
				<span>{t("bonus", { amount: formatNumber(dayResult?.bonus ?? 0) })}</span>
				<span className="text-ink font-semibold">
					{t("total", { amount: formatNumber(dayResult?.total ?? 0) })}
				</span>
			</div>
		</Card>
	);
}
