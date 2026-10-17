import { useTranslations } from "next-intl";
import type { CoreEventId } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { dayLabelOf } from "@/service/coreEvents";
import type { DayRow } from "@/service/historyEvents";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { DiffText } from "./DiffText";
import { useHistoryText } from "./useHistoryText";

const COLUMNS =
	"grid grid-cols-[minmax(3.5rem,1fr)_4.5rem_4.5rem_4.5rem] items-baseline gap-x-3 lg:grid-cols-[minmax(0,1fr)_7rem_7rem_7rem_3.5rem_3.5rem] lg:gap-x-4";

function DayLine({ event, row }: { event: CoreEventId; row: DayRow }) {
	const t = useTranslations("history.compare");
	const { rankOf } = useHistoryText();
	const label = dayLabelOf(event, row.id);
	const percent = formatNumber(Math.round(row.share * 100));

	return (
		<li className="border-line border-t-[1.5px] py-3 first:border-t-0">
			<div className={COLUMNS}>
				<span className="font-semibold whitespace-nowrap">{label}</span>
				<span className="text-muted text-right font-mono">{formatNumber(row.plan)}</span>
				<span className="text-right font-mono font-semibold">
					{row.actual === null ? "-" : formatNumber(row.actual)}
				</span>
				<span className="text-right">
					{row.difference === null ? (
						<span className="font-mono">-</span>
					) : (
						<DiffText difference={row.difference} />
					)}
				</span>
				<span className="hidden text-right font-mono lg:block">{rankOf(row.rank)}</span>
				<span className="hidden text-right font-mono lg:block">
					{rankOf(row.allianceRank)}
				</span>
			</div>
			<div className="mt-2 grid grid-cols-1 items-center gap-1 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-4">
				<ProgressBar value={row.share} label={t("barLabel", { day: label })} />
				<span className="text-muted font-mono text-xs lg:hidden">
					{t("shareLine", {
						percent,
						rank: rankOf(row.rank),
						ally: rankOf(row.allianceRank),
					})}
				</span>
				<span className="text-muted hidden w-30 text-right font-mono text-xs lg:block">
					{t("share", { percent })}
				</span>
			</div>
		</li>
	);
}

function ColumnHeads() {
	const t = useTranslations("history.compare");

	return (
		<div
			aria-hidden="true"
			className={`${COLUMNS} text-muted border-line border-b-[1.5px] pb-2 font-mono text-[11px] tracking-[0.08em] uppercase`}
		>
			<span>{t("day")}</span>
			<span className="text-right">{t("plan")}</span>
			<span className="text-right">{t("actual")}</span>
			<span className="text-right">{t("diff")}</span>
			<span className="hidden text-right lg:block">{t("rank")}</span>
			<span className="hidden text-right lg:block">{t("ally")}</span>
		</div>
	);
}

interface PlanAgainstActualProps {
	event: CoreEventId;
	days: DayRow[];
	total: { plan: number; actual: number; difference: number };
}

export function PlanAgainstActual({ event, days, total }: PlanAgainstActualProps) {
	const t = useTranslations("history.compare");

	return (
		<Card className="flex flex-col gap-3 p-5">
			<h2 className="text-lg font-semibold">
				{event === "svs" ? t("titleDays") : t("title")}
			</h2>
			<div>
				<ColumnHeads />
				<ul>
					{days.map((row) => (
						<DayLine key={row.id} event={event} row={row} />
					))}
				</ul>
				<div className={`${COLUMNS} border-line border-t-[1.5px] pt-3`}>
					<span className="font-semibold">{t("total")}</span>
					<span className="text-muted text-right font-mono">
						{formatNumber(total.plan)}
					</span>
					<span className="text-right font-mono font-semibold">
						{formatNumber(total.actual)}
					</span>
					<span className="text-right">
						<DiffText difference={total.difference} />
					</span>
				</div>
			</div>
		</Card>
	);
}

export function BattlePhaseCard({ event, row }: { event: CoreEventId; row: DayRow }) {
	const t = useTranslations("history.battle");

	return (
		<Card className="flex flex-col gap-1 p-5">
			<h2 className="text-lg font-semibold">{t("title")}</h2>
			<p className="text-muted">{t("note")}</p>
			<ul className="mt-2">
				<DayLine event={event} row={row} />
			</ul>
		</Card>
	);
}
