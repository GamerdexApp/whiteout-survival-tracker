import { useTranslations } from "next-intl";
import type { CoreEventId } from "@/types/app";
import { formatNumber } from "@/lib/format";
import type { EventDay, EventResult } from "@/service/coreEvents";
import { dayLabelOf, dayTotalOf } from "@/service/coreEvents";
import { Card } from "@/comps/ui/Card";

interface DaysCardProps {
	event: CoreEventId;
	days: EventDay[];
	result: EventResult;
	selectedId: string;
	onSelect: (dayId: string) => void;
}

export function DaysCard({ event, days, result, selectedId, onSelect }: DaysCardProps) {
	const t = useTranslations("coreEvents.daysSection");

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h2 className="font-semibold">{event === "hall" ? t("stages") : t("title")}</h2>
				<span className="text-muted font-mono text-xs uppercase">
					{event === "hall" ? t("totalPerStage") : t("totalPerDay")}
				</span>
			</div>
			<div className="flex flex-wrap gap-2">
				{days.map((day) => {
					const active = day.id === selectedId;
					return (
						<button
							key={day.id}
							type="button"
							aria-pressed={active}
							onClick={() => onSelect(day.id)}
							className={`flex min-h-11 min-w-20 flex-col items-center justify-center rounded-md border-[1.5px] px-3 py-1 lg:min-h-12 ${
								active
									? "border-primary bg-primary text-on-primary"
									: "border-line bg-surface hover:bg-tint"
							}`}
						>
							<span className="font-semibold">{dayLabelOf(event, day.id)}</span>
							<span className="font-mono text-xs">
								{formatNumber(dayTotalOf(result, day.id))}
							</span>
						</button>
					);
				})}
			</div>
			{event === "hall" && <p className="text-muted">{t("hallSeason")}</p>}
			{event === "showdown" && <p className="text-muted">{t("showdownScope")}</p>}
		</Card>
	);
}
