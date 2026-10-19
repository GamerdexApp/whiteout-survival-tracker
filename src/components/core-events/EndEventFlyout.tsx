"use client";

import { useTranslations } from "next-intl";
import type { CoreEventId, Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { useNow } from "@/lib/hooks/useNow";
import {
	dayLabelOf,
	eventDatesOf,
	lockedTotalOf,
	logOf,
	unlockedDaysOf,
} from "@/service/coreEvents";
import { formatTypedDate } from "@/service/eventLogView";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { Note } from "@/comps/ui/Note";

interface EndEventFlyoutProps {
	open: boolean;
	chief: Playthrough;
	event: CoreEventId;
	onCancel: () => void;
	onConfirm: () => void;
}

export function EndEventFlyout({ open, chief, event, onCancel, onConfirm }: EndEventFlyoutProps) {
	const t = useTranslations("eventLog");
	const te = useTranslations("eventLog.end");
	const log = logOf(chief, event);
	const now = useNow();
	const { start, end } = eventDatesOf(chief, event, now);
	const eventName = t(`eventShort.${event}`);
	const unlocked = unlockedDaysOf(chief, event);
	const hasRanks = log.overall?.rank !== undefined || log.overall?.allianceRank !== undefined;
	const lockedTotal = { total: formatNumber(lockedTotalOf(chief, event)) };
	const lockedTotalText =
		event === "svs"
			? te("lockedTotalSvs", lockedTotal)
			: event === "hall"
				? te("lockedTotalStages", lockedTotal)
				: te("lockedTotal", lockedTotal);

	return (
		<Flyout
			open={open}
			onClose={onCancel}
			title={te("title", { event: eventName })}
			footer={
				<>
					<Button onClick={onCancel}>{te("cancel")}</Button>
					<Button variant="primary" onClick={onConfirm}>
						{te("confirm")}
					</Button>
				</>
			}
		>
			<Card className="bg-tint flex flex-col gap-2 p-4">
				<h3 className="font-semibold">
					{start && end
						? te("dates", {
								event: eventName,
								start: formatTypedDate(start),
								end: formatTypedDate(end),
							})
						: te("noDates", { event: eventName })}
				</h3>
				<p>
					{lockedTotalText}
					{hasRanks ? "" : ` ${te("noRanks")}`}
				</p>
				{unlocked.length === 0 ? (
					<p className="text-muted">{te("allLocked")}</p>
				) : (
					<Note tone="warning">
						{te("unlocked", {
							count: unlocked.length,
							amount: formatNumber(unlocked.length),
						})}{" "}
						{te("unlockedList", {
							days: unlocked.map((day) => dayLabelOf(event, day.id)).join(", "),
						})}
					</Note>
				)}
			</Card>
			<div className="flex flex-col gap-2">
				<h3 className="font-semibold">{te("what")}</h3>
				<ul className="flex list-disc flex-col gap-2 ps-5">
					<li>{te("saves")}</li>
					<li>{te("clearsCounts")}</li>
					<li>{te("clearsPlans")}</li>
					<li>{te("keeps")}</li>
				</ul>
			</div>
		</Flyout>
	);
}
