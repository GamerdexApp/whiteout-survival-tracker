"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CoreEventId, Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { useNow } from "@/lib/hooks/useNow";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { useUrlTab } from "@/lib/hooks/useUrlTab";
import { withSavedBeastPlan } from "@/service/beasts";
import type { BeastPlanDraft } from "@/service/beasts";
import { describeChief, updateChiefById } from "@/service/chiefs";
import {
	calculateEvent,
	eventDaysOf,
	eventStatusOf,
	shownEventsOf,
	withActionCount,
} from "@/service/coreEvents";
import { PageHeader } from "@/comps/layout/PageHeader";
import { ButtonLink } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Tabs } from "@/comps/ui/Tabs";
import { ActionTable } from "./ActionTable";
import { BeastPlanFlyout } from "./BeastPlanFlyout";
import { BonusCard } from "./BonusCard";
import { DaysCard } from "./DaysCard";
import { EventChecklistFlyout } from "./EventChecklistFlyout";
import { EventLogFlyout } from "./EventLogFlyout";
import { EventStrip } from "./EventStrip";
import { RankCard } from "./RankCard";
import { PerDayCard, TotalCard } from "./ResultCards";
import { ThresholdsCard } from "./ThresholdsCard";

const eventIds: CoreEventId[] = ["svs", "showdown", "king", "hall"];

export function CoreEventsView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("coreEvents");
	const { updateData } = usePlaythrough();
	const { ui } = useUiSettings();
	const now = useNow();
	const shown = shownEventsOf(chief);
	const [pickedEvent, setPickedEvent] = useUrlTab(eventIds, "svs");
	const [pickedDays, setPickedDays] = useState<Partial<Record<CoreEventId, string>>>({});
	const [checklistOpen, setChecklistOpen] = useState(false);
	const [logOpen, setLogOpen] = useState(false);
	const [beastPlanOpen, setBeastPlanOpen] = useState(false);

	const event = shown.includes(pickedEvent) ? pickedEvent : shown[0];
	const result = event ? calculateEvent(chief, event) : null;

	const header = (
		<PageHeader
			title={t("page.title")}
			subline={t("page.subline", {
				chief: chief.name,
				details: describeChief(chief, ui.furnaceFullLabels),
			})}
		/>
	);

	if (!event || !result) {
		return (
			<>
				{header}
				<EmptyState
					title={t("empty.title")}
					description={t("empty.description")}
					actions={<ButtonLink href="/chiefs">{t("empty.action")}</ButtonLink>}
				/>
			</>
		);
	}

	const days = eventDaysOf(event, chief);
	const status = eventStatusOf(chief, event, now);
	const pickedDay = pickedDays[event];
	const dayId = days.find((day) => day.id === pickedDay)?.id ?? status.todayId ?? days[0].id;
	const day = days.find((item) => item.id === dayId) ?? days[0];

	const setCount = (action: string, total: number) =>
		updateData((data) =>
			updateChiefById(data, chief.id, (current) =>
				withActionCount(current, event, dayId, action, total)
			)
		);

	const saveBeastPlan = (plan: BeastPlanDraft) => {
		updateData((data) =>
			updateChiefById(data, chief.id, (current) =>
				withSavedBeastPlan(current, plan, new Date().toISOString())
			)
		);
	};

	return (
		<>
			{header}
			<Tabs
				label={t("tabs.label")}
				tabs={shown.map((id) => ({ id, label: t(`events.${id}`) }))}
				activeId={event}
				onChange={setPickedEvent}
			>
				<EventStrip
					chief={chief}
					event={event}
					status={status}
					onChecklist={() => setChecklistOpen(true)}
					onLog={() => setLogOpen(true)}
					onBeastPlan={event === "svs" ? () => setBeastPlanOpen(true) : undefined}
				/>
				<div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
					<div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
						<div className="max-lg:order-2">
							<BonusCard
								chief={chief}
								event={event}
								bonusPercent={result.bonusPercent}
							/>
						</div>
						<div className="max-lg:order-3">
							<DaysCard
								event={event}
								days={days}
								result={result}
								selectedId={dayId}
								onSelect={(id) => setPickedDays({ ...pickedDays, [event]: id })}
							/>
						</div>
						<div className="max-lg:order-4">
							<ActionTable
								chief={chief}
								event={event}
								day={day}
								result={result}
								onCount={setCount}
							/>
						</div>
					</div>
					<div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
						<div className="max-lg:order-1">
							<TotalCard event={event} dayId={dayId} result={result} />
						</div>
						<div className="max-lg:order-5">
							<PerDayCard event={event} dayId={dayId} result={result} />
						</div>
						<div className="max-lg:order-6">
							<ThresholdsCard
								chief={chief}
								event={event}
								dayId={dayId}
								result={result}
							/>
						</div>
						<div className="max-lg:order-7">
							<RankCard event={event} dayId={dayId} />
						</div>
					</div>
				</div>
			</Tabs>
			<EventChecklistFlyout
				open={checklistOpen}
				chief={chief}
				event={event}
				initialDayId={dayId}
				onClose={() => setChecklistOpen(false)}
			/>
			<BeastPlanFlyout
				open={beastPlanOpen}
				chief={chief}
				onClose={() => setBeastPlanOpen(false)}
				onSave={saveBeastPlan}
			/>
			<EventLogFlyout
				open={logOpen}
				chief={chief}
				event={event}
				onClose={() => setLogOpen(false)}
			/>
		</>
	);
}
