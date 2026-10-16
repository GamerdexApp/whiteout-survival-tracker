import { useTranslations } from "next-intl";
import type { CoreEventId, Playthrough } from "@/types/app";
import { formatShortDate } from "@/lib/format";
import type { EventStatus } from "@/service/coreEvents";
import { dayLabelOf, logOf } from "@/service/coreEvents";
import { Button } from "@/comps/ui/Button";

const localNoonOf = (date: string) => `${date}T12:00:00`;

interface EventStripProps {
	chief: Playthrough;
	event: CoreEventId;
	status: EventStatus;
	onChecklist: () => void;
	onLog: () => void;
}

export function EventStrip({ chief, event, status, onChecklist, onLog }: EventStripProps) {
	const t = useTranslations("coreEvents.strip");
	const { start, end } = logOf(chief, event);
	const dates =
		start && end
			? t("dates", {
					start: formatShortDate(localNoonOf(start)),
					end: formatShortDate(localNoonOf(end)),
				})
			: t("noDates");

	return (
		<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
			<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
				{status.live && (
					<span className="bg-tint border-line inline-flex items-center gap-2 rounded-full border-[1.5px] px-2.5 py-0.5 font-mono text-xs">
						<span aria-hidden="true" className="bg-kept size-2 rounded-full" />
						{t("live")}
					</span>
				)}
				<span className="text-muted">
					{dates}
					{status.todayId &&
						` · ${t("today", { day: dayLabelOf(event, status.todayId) })}`}
				</span>
			</div>
			<div className="grid grid-cols-2 gap-3 lg:flex">
				<Button onClick={onChecklist}>{t("checklist")}</Button>
				<Button onClick={onLog}>{t("log")}</Button>
			</div>
		</div>
	);
}
