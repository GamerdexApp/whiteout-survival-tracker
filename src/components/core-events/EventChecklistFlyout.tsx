"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuCheck } from "react-icons/lu";
import type { CoreEventId, Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { updateChiefById } from "@/service/chiefs";
import {
	calculateEvent,
	castleSignedUpOf,
	checklistActionsOf,
	dayLabelOf,
	eventDaysOf,
	hasNextDay,
	resourcesToUseOf,
	withCastleSignedUp,
	withChecked,
	withClearedChecks,
} from "@/service/coreEvents";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { CheckChip } from "@/comps/ui/CheckChip";
import { Flyout } from "@/comps/ui/Flyout";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SavedChip } from "@/comps/ui/SavedChip";

export interface EventChecklistFlyoutProps {
	open: boolean;
	chief: Playthrough;
	event: CoreEventId;
	/** The day or stage selected on the page. The chips start here. */
	initialDayId: string;
	onClose: () => void;
}

export function EventChecklistFlyout({
	open,
	chief,
	event,
	initialDayId,
	onClose,
}: EventChecklistFlyoutProps) {
	const t = useTranslations("eventLog.checklist");
	const { updateData } = usePlaythrough();
	const [wasOpen, setWasOpen] = useState(false);
	const [dayId, setDayId] = useState(initialDayId);

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) setDayId(initialDayId);
	}

	const change = (update: (current: Playthrough) => Playthrough) =>
		updateData((data) => updateChiefById(data, chief.id, update));

	const actions = checklistActionsOf(chief, event, dayId);
	const hasChecks = actions.some((action) => action.checked);

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			description={t("description", { day: dayLabelOf(event, dayId) })}
			footer={
				<>
					<span className="mr-auto">
						<SavedChip />
					</span>
					<Button
						disabled={!hasChecks}
						onClick={() =>
							change((current) => withClearedChecks(current, event, dayId))
						}
					>
						{t("clear")}
					</Button>
					<Button variant="primary" onClick={onClose}>
						{t("close")}
					</Button>
				</>
			}
		>
			<DayChips chief={chief} event={event} dayId={dayId} onSelect={setDayId} />
			{hasNextDay(chief, event, dayId) && (
				<CastleReminder chief={chief} event={event} dayId={dayId} onChange={change} />
			)}
			<DayPlan chief={chief} event={event} dayId={dayId} onChange={change} />
		</Flyout>
	);
}

interface DayProps {
	chief: Playthrough;
	event: CoreEventId;
	dayId: string;
}

interface ChangeProps {
	onChange: (update: (chief: Playthrough) => Playthrough) => void;
}

function DayChips({
	chief,
	event,
	dayId,
	onSelect,
}: DayProps & { onSelect: (dayId: string) => void }) {
	const t = useTranslations("eventLog.checklist");

	return (
		<div role="group" aria-label={t("dayChips")} className="flex flex-wrap gap-2">
			{eventDaysOf(event, chief).map((day) => {
				const selected = day.id === dayId;
				return (
					<button
						key={day.id}
						type="button"
						aria-pressed={selected}
						onClick={() => onSelect(day.id)}
						className={`min-h-11 rounded-md border-[1.5px] px-3.5 font-medium lg:min-h-9 ${
							selected
								? "border-primary bg-primary text-on-primary"
								: "border-line bg-surface hover:bg-tint"
						}`}
					>
						{dayLabelOf(event, day.id)}
					</button>
				);
			})}
		</div>
	);
}

function CastleReminder({ chief, event, dayId, onChange }: DayProps & ChangeProps) {
	const t = useTranslations("eventLog.checklist");
	const days = eventDaysOf(event, chief);
	const nextDay = dayLabelOf(event, days[days.findIndex((day) => day.id === dayId) + 1].id);

	return (
		<Card highlighted className="bg-tint flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{t("castleTitle", { day: nextDay })}</h3>
			<p>{t("castleBody", { day: nextDay })}</p>
			<div className="flex">
				<CheckChip
					label={t("castleCheck", { day: nextDay })}
					checked={castleSignedUpOf(chief, event, dayId)}
					onChange={(signedUp) =>
						onChange((current) => withCastleSignedUp(current, event, dayId, signedUp))
					}
				/>
			</div>
		</Card>
	);
}

function DayPlan({ chief, event, dayId, onChange }: DayProps & ChangeProps) {
	const t = useTranslations("eventLog.checklist");
	const actions = checklistActionsOf(chief, event, dayId);
	const resources = resourcesToUseOf(chief, event, dayId);
	const done = actions.filter((action) => action.checked).length;
	const day = eventDaysOf(event, chief).find((item) => item.id === dayId);
	const planTotal =
		calculateEvent(chief, event).days.find((item) => item.id === dayId)?.total ?? 0;

	return (
		<>
			<Card className="flex flex-col gap-3 p-4">
				<div className="flex items-baseline justify-between gap-3">
					<h3 className="font-semibold">
						{t("dayTitle", { day: dayLabelOf(event, dayId), name: day?.name ?? "" })}
					</h3>
					{actions.length > 0 && (
						<span className="text-muted font-mono text-xs">
							{t("done", {
								done: formatNumber(done),
								total: formatNumber(actions.length),
							})}
						</span>
					)}
				</div>
				{actions.length > 0 && (
					<ProgressBar value={done / actions.length} label={t("progress")} />
				)}
				<p className="text-muted">
					{actions.length === 0
						? t("empty")
						: t("planLine", { points: formatNumber(planTotal) })}
				</p>
			</Card>
			{resources.length > 0 && (
				<Card className="flex flex-col gap-3 p-4">
					<h3 className="font-semibold">{t("resources")}</h3>
					<p className="text-muted">{t("resourcesHint")}</p>
					<ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{resources.map((resource) => (
							<li
								key={resource.name}
								className="border-line bg-tint flex items-center justify-between gap-3 rounded-md border-[1.5px] px-3 py-2"
							>
								<span>{resource.name}</span>
								<span className="font-mono font-semibold">
									{formatNumber(resource.amount)}
								</span>
							</li>
						))}
					</ul>
				</Card>
			)}
			{actions.length > 0 && (
				<Card className="flex flex-col gap-1 p-4">
					<h3 className="pb-2 font-semibold">{t("actions")}</h3>
					<ul className="divide-line divide-y-[1.5px]">
						{actions.map((action) => (
							<li key={action.action}>
								<label className="flex min-h-11 cursor-pointer items-center gap-3 py-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-[:focus-visible]:outline-(--ring)">
									<input
										type="checkbox"
										checked={action.checked}
										onChange={(input) =>
											onChange((current) =>
												withChecked(
													current,
													event,
													dayId,
													action.action,
													input.target.checked
												)
											)
										}
										className="sr-only"
									/>
									<span
										aria-hidden="true"
										className={`flex size-5 shrink-0 items-center justify-center rounded-sm border-[1.5px] ${
											action.checked
												? "border-primary bg-primary text-on-primary"
												: "border-line"
										}`}
									>
										{action.checked && <LuCheck size={14} />}
									</span>
									<span
										className={`min-w-0 flex-1 ${action.checked ? "text-muted line-through" : ""}`}
									>
										{action.action}
									</span>
									<span className="flex shrink-0 flex-col items-end font-mono text-xs">
										<span className="text-sm font-semibold">
											{t("count", { count: formatNumber(action.count) })}
										</span>
										<span className="text-muted">
											{t("points", { points: formatNumber(action.total) })}
										</span>
									</span>
								</label>
							</li>
						))}
					</ul>
				</Card>
			)}
		</>
	);
}
