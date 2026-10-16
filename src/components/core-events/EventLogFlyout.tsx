"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CoreEventId, EventHistoryEntry, Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { updateChiefById } from "@/service/chiefs";
import { endEvent, historyOf, withoutHistoryEntry } from "@/service/coreEvents";
import { Button } from "@/comps/ui/Button";
import { Flyout } from "@/comps/ui/Flyout";
import { SavedChip } from "@/comps/ui/SavedChip";
import { Tabs } from "@/comps/ui/Tabs";
import { useToast } from "@/comps/ui/Toast";
import { EndEventFlyout } from "./EndEventFlyout";
import { EventHistoryList } from "./EventHistoryList";
import { EventLogCurrent } from "./EventLogCurrent";

export interface EventLogFlyoutProps {
	open: boolean;
	chief: Playthrough;
	event: CoreEventId;
	onClose: () => void;
}

type LogTab = "current" | "history";

export function EventLogFlyout({ open, chief, event, onClose }: EventLogFlyoutProps) {
	const t = useTranslations("eventLog");
	const { updateData } = usePlaythrough();
	const showToast = useToast();
	const [wasOpen, setWasOpen] = useState(false);
	const [tab, setTab] = useState<LogTab>("current");
	const [endOpen, setEndOpen] = useState(false);

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) setTab("current");
	}

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const handleEnd = () => {
		const before = chief;
		const endedAt = new Date().toISOString();
		if (!change((current) => endEvent(current, event, endedAt))) return;
		setEndOpen(false);
		onClose();
		showToast({
			variant: "success",
			title: t("end.toastTitle"),
			message: t("end.toastMessage", { event: t(`eventShort.${event}`) }),
			action: { label: t("end.undo"), onAction: () => change(() => before) },
		});
	};

	const handleRemove = (entry: EventHistoryEntry) => {
		const before = chief;
		if (!change((current) => withoutHistoryEntry(current, event, entry.id))) return;
		onClose();
		showToast({
			variant: "warning",
			title: t("history.removedTitle"),
			message: t("history.removedMessage", { event: t(`eventShort.${event}`) }),
			action: { label: t("history.undo"), onAction: () => change(() => before) },
		});
	};

	return (
		<>
			<Flyout
				open={open}
				onClose={onClose}
				title={t("title")}
				description={t(`events.${event}`)}
				footer={
					tab === "current" ? (
						<>
							<span className="mr-auto">
								<SavedChip />
							</span>
							<Button onClick={onClose}>{t("footer.close")}</Button>
							<Button variant="danger" onClick={() => setEndOpen(true)}>
								{t("footer.endEvent")}
							</Button>
						</>
					) : (
						<>
							<span className="text-muted mr-auto text-sm">
								{t("footer.readOnly")}
							</span>
							<Button onClick={onClose}>{t("footer.close")}</Button>
						</>
					)
				}
			>
				<Tabs
					label={t("tabs.label")}
					tabs={[
						{ id: "current", label: t("tabs.current") },
						{
							id: "history",
							label: t("tabs.history"),
							count: historyOf(chief, event).length,
						},
					]}
					activeId={tab}
					onChange={setTab}
				>
					{tab === "current" ? (
						<EventLogCurrent chief={chief} event={event} onChange={change} />
					) : (
						<EventHistoryList chief={chief} event={event} onRemove={handleRemove} />
					)}
				</Tabs>
			</Flyout>
			<EndEventFlyout
				open={endOpen}
				chief={chief}
				event={event}
				onCancel={() => setEndOpen(false)}
				onConfirm={handleEnd}
			/>
		</>
	);
}
