"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { EventResultState, Playthrough, UserEventState } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { useNow } from "@/lib/hooks/useNow";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { describeChief, updateChiefById } from "@/service/chiefs";
import { entriesOfChief, withoutUserEvent, withUserEvent } from "@/service/eventsPage";
import { defaultGives } from "@/service/eventsPage";
import { withResult } from "@/service/eventsResults";
import { suggestedRepeat, suggestedRuns, withRolledEvents } from "@/service/eventsSchedule";
import type { EventsZone } from "@/service/eventsSchedule";
import type { GameEvent } from "@/data/game/gameEvents";
import { gameEventById } from "@/data/game/gameEvents";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Tabs } from "@/comps/ui/Tabs";
import { useToast } from "@/comps/ui/Toast";
import { AddEventFlyout } from "./AddEventFlyout";
import { CalendarTab } from "./CalendarTab";
import { CoreCyclesCard, CYCLE_EVENT_IDS } from "./CoreCyclesCard";
import { HistoryTab } from "./HistoryTab";
import { MyEventsTab } from "./MyEventsTab";
import { ResultFlyout } from "./ResultFlyout";
import type { ResultTarget } from "./ResultFlyout";
import { ScheduleFlyout } from "./ScheduleFlyout";
import type { ScheduleTarget } from "./ScheduleFlyout";

type EventsTab = "calendar" | "mine" | "history";

export function EventsView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("events");
	const { updateData } = usePlaythrough();
	const showToast = useToast();
	const { ui } = useUiSettings();
	const now = useNow();
	const [tab, setTab] = useState<EventsTab>("calendar");
	const [addOpen, setAddOpen] = useState(false);
	const [schedule, setSchedule] = useState<ScheduleTarget | null>(null);
	const [result, setResult] = useState<ResultTarget | null>(null);

	const entries = entriesOfChief(chief);
	const zone: EventsZone = chief.eventsTimeZone ?? "utc";

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const rolled = (current: Playthrough, nowMs: number): Playthrough => ({
		...current,
		userEvents: withRolledEvents(current.userEvents, nowMs),
	});

	const setZone = (next: EventsZone) => {
		change((current) => ({ ...current, eventsTimeZone: next }));
	};

	const openAdd = (event: GameEvent) => {
		const nowMs = Date.now();
		setAddOpen(false);
		setSchedule({
			event,
			adding: true,
			initial: {
				eventId: event.id,
				repeat: suggestedRepeat(event) ?? { kind: "none" },
				runs: suggestedRuns(event, nowMs),
				gives: defaultGives(event),
			},
		});
	};

	const openEdit = (state: UserEventState) => {
		const event = gameEventById(state.eventId);
		if (!event) return;
		setSchedule({ event, adding: false, initial: state });
	};

	const saveSchedule = (state: UserEventState) => {
		const nowMs = Date.now();
		if (!change((current) => withUserEvent(rolled(current, nowMs), state))) return;
		setSchedule(null);
		setTab((current) =>
			current === "history" || CYCLE_EVENT_IDS.includes(state.eventId) ? current : "mine"
		);
	};

	const removeEvent = (state: UserEventState) => {
		const nowMs = Date.now();
		const event = gameEventById(state.eventId);
		if (!change((current) => withoutUserEvent(rolled(current, nowMs), state.eventId))) return;
		showToast({
			variant: "warning",
			title: t("toast.removedTitle", { name: event?.name ?? state.eventId }),
			message: t("toast.removedMessage"),
			action: {
				label: t("toast.undo"),
				onAction: () => change((current) => withUserEvent(current, state)),
			},
		});
	};

	const saveResult = (next: EventResultState): boolean => {
		const nowMs = Date.now();
		if (!change((current) => withResult(rolled(current, nowMs), next))) return false;
		setResult(null);
		showToast({
			variant: "success",
			title: t("toast.resultSavedTitle"),
			message: t("toast.resultSavedMessage", {
				name: gameEventById(next.eventId)?.name ?? next.eventId,
			}),
		});
		return true;
	};

	const cycles = (
		<CoreCyclesCard
			states={chief.userEvents ?? []}
			zone={zone}
			nowMs={now}
			onSet={openAdd}
			onEdit={openEdit}
		/>
	);

	const header = (
		<PageHeader
			title={t("page.title")}
			subline={t("page.subline", {
				chief: chief.name,
				details: describeChief(chief, ui.furnaceFullLabels),
			})}
		/>
	);

	const flyouts = (
		<>
			<AddEventFlyout
				open={addOpen}
				chief={chief}
				onPick={openAdd}
				onClose={() => setAddOpen(false)}
			/>
			<ScheduleFlyout
				target={schedule}
				onSave={saveSchedule}
				onClose={() => setSchedule(null)}
			/>
			<ResultFlyout
				target={result}
				chief={chief}
				nowMs={now}
				zone={zone}
				onSave={saveResult}
				onClose={() => setResult(null)}
			/>
		</>
	);

	if (entries.length === 0) {
		return (
			<>
				{header}
				{cycles}
				<Card className="flex flex-col items-center gap-4 border-dashed px-6 py-12 text-center">
					<h2 className="text-lg font-semibold">{t("empty.title")}</h2>
					<p className="text-muted max-w-lg">{t("empty.description")}</p>
					<Button variant="primary" onClick={() => setAddOpen(true)}>
						{t("actions.addEvent")}
					</Button>
					<ol className="flex max-w-xl flex-col gap-3 text-start">
						{(["pick", "start", "roll"] as const).map((step, index) => (
							<li key={step} className="flex items-start gap-3">
								<span
									aria-hidden="true"
									className="bg-tint text-muted flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs"
								>
									{formatNumber(index + 1)}
								</span>
								<p>
									<span className="font-semibold">
										{t(`empty.steps.${step}.title`)}
									</span>{" "}
									{t(`empty.steps.${step}.text`)}
								</p>
							</li>
						))}
					</ol>
				</Card>
				{flyouts}
			</>
		);
	}

	return (
		<>
			{header}
			<div className="relative">
				<Tabs
					label={t("tabs.label")}
					tabs={[
						{ id: "calendar", label: t("tabs.calendar") },
						{
							id: "mine",
							label: t("tabs.mine"),
							count: entries.length,
						},
						{ id: "history", label: t("tabs.history") },
					]}
					activeId={tab}
					onChange={setTab}
				>
					<div className="flex gap-3 lg:absolute lg:inset-e-0 lg:-top-2">
						<Button
							className="flex-1 lg:flex-none"
							onClick={() => setResult({ kind: "new" })}
						>
							{t("actions.addDetails")}
						</Button>
						<Button
							variant="primary"
							className="flex-1 lg:flex-none"
							onClick={() => setAddOpen(true)}
						>
							{t("actions.addEvent")}
						</Button>
					</div>
					{tab === "calendar" && (
						<CalendarTab
							entries={entries}
							cycles={cycles}
							zone={zone}
							nowMs={now}
							onZone={setZone}
						/>
					)}
					{tab === "mine" && (
						<MyEventsTab
							chief={chief}
							entries={entries}
							zone={zone}
							nowMs={now}
							onEdit={openEdit}
							onRemove={removeEvent}
						/>
					)}
					{tab === "history" && (
						<HistoryTab
							chief={chief}
							zone={zone}
							nowMs={now}
							onEdit={(id) => setResult({ kind: "edit", resultId: id })}
						/>
					)}
				</Tabs>
			</div>
			{flyouts}
		</>
	);
}
