"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CoreEventId, Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { updateChiefById } from "@/service/chiefs";
import { dayLabelOf } from "@/service/coreEvents";
import {
	eventSummaryOf,
	firstDayByGroup,
	scoreGroup,
	scoringDaysOf,
	withExportedPlan,
} from "@/service/eventExport";
import type { DayByGroup, ExportSpec } from "@/service/eventExport";
import { CORE_EVENT_IDS } from "@/data/game/coreEvents";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { Note } from "@/comps/ui/Note";
import { useToast } from "@/comps/ui/Toast";

interface ExportToEventFlyoutProps {
	open: boolean;
	chief: Playthrough;
	/** What the plan scores. Null while the plan has nothing to export. */
	spec: ExportSpec;
	onClose: () => void;
}

function Chip({
	label,
	pressed,
	disabled = false,
	onClick,
}: {
	label: string;
	pressed: boolean;
	disabled?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			aria-pressed={pressed}
			disabled={disabled}
			onClick={onClick}
			className={`min-h-11 rounded-full border-[1.5px] px-3 font-medium disabled:opacity-50 lg:min-h-9 ${pressed ? "border-primary bg-tint text-primary" : "border-line bg-surface hover:bg-tint"}`}
		>
			{label}
		</button>
	);
}

export function ExportToEventFlyout({ open, chief, spec, onClose }: ExportToEventFlyoutProps) {
	const t = useTranslations("eventExport");
	const showToast = useToast();
	const { updateData } = usePlaythrough();
	const [wasOpen, setWasOpen] = useState(false);
	const [event, setEvent] = useState<CoreEventId>("svs");
	const [dayByGroup, setDayByGroup] = useState<DayByGroup>({});

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			setEvent("svs");
			setDayByGroup(firstDayByGroup(chief, "svs", spec));
		}
	}

	const chooseEvent = (next: CoreEventId) => {
		setEvent(next);
		setDayByGroup(firstDayByGroup(chief, next, spec));
	};

	const summary = eventSummaryOf(chief, spec);
	const scoredGroups = spec.groups.map((group) => ({
		group,
		days: scoringDaysOf(chief, event, group),
		scored: dayByGroup[group.id] ? scoreGroup(chief, event, dayByGroup[group.id], group) : null,
	}));
	const total = scoredGroups.reduce((sum, item) => sum + (item.scored?.total ?? 0), 0);
	const canExport = total > 0;
	const eventName = t(`events.${event}`);

	const exportPlan = () => {
		const before = chief;
		const savedAt = new Date().toISOString();
		if (
			!updateData((data) =>
				updateChiefById(data, chief.id, (current) =>
					withExportedPlan(current, spec, event, dayByGroup, savedAt)
				)
			)
		)
			return;
		onClose();
		showToast({
			variant: "success",
			title: t("toast.title"),
			message: t("toast.message", { points: formatNumber(total), event: eventName }),
			action: {
				label: t("toast.undo"),
				onAction: () => updateData((data) => updateChiefById(data, chief.id, () => before)),
			},
		});
	};

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			description={t("description")}
			footer={
				<>
					<Button onClick={onClose}>{t("cancel")}</Button>
					<Button variant="primary" disabled={!canExport} onClick={exportPlan}>
						{t("export", { event: eventName })}
					</Button>
				</>
			}
		>
			<Card className="flex flex-col gap-3 p-4">
				<h3 className="font-semibold">{t("stepEvent")}</h3>
				<div role="group" aria-label={t("stepEvent")} className="flex flex-wrap gap-2">
					{CORE_EVENT_IDS.map((id) => (
						<Chip
							key={id}
							label={t(`events.${id}`)}
							pressed={event === id}
							onClick={() => chooseEvent(id)}
						/>
					))}
				</div>
				{scoredGroups.map(({ group, days }, index) => (
					<div key={group.id} className="flex flex-col gap-2">
						<h3 className="font-semibold">
							{t("stepDay", {
								number: formatNumber(index + 2),
								group: group.label ?? "",
							})}
						</h3>
						{days.length === 0 ? (
							<p className="text-muted">{t("noDay", { event: eventName })}</p>
						) : (
							<div
								role="group"
								aria-label={group.label ?? t("stepDayPlain")}
								className="flex flex-wrap gap-2"
							>
								{days.map((day) => (
									<Chip
										key={day.id}
										label={`${dayLabelOf(event, day.id)} ${day.name}`}
										pressed={dayByGroup[group.id] === day.id}
										onClick={() =>
											setDayByGroup({ ...dayByGroup, [group.id]: day.id })
										}
									/>
								))}
							</div>
						)}
					</div>
				))}
				<p className="text-muted text-xs">{t("daysHint")}</p>
			</Card>

			<Card className="flex flex-col gap-1 p-4">
				<h3 className="font-semibold">
					{t("stepItems", { number: formatNumber(spec.groups.length + 2) })}
				</h3>
				{scoredGroups.flatMap(({ group, scored }) =>
					(
						scored?.lines ??
						group.lines.map((line) => ({ line, row: undefined, points: 0 }))
					).map(({ line, row, points }) => (
						<div
							key={`${group.id}-${line.id}`}
							className={`border-line flex items-start justify-between gap-3 border-t-[1.5px] py-2 first:border-t-0 ${row ? "" : "text-muted"}`}
						>
							<span className="flex min-w-0 flex-col">
								<span className="font-semibold">{line.label}</span>
								<span className="text-muted text-xs">
									{row
										? t("lineEach", {
												points: formatNumber(row.points),
												day: dayByGroup[group.id]
													? dayLabelOf(event, dayByGroup[group.id])
													: "",
											})
										: t("lineNotScored", { event: eventName })}
									{line.detail ? ` ${line.detail}` : ""}
								</span>
							</span>
							<span className="flex flex-col items-end font-mono">
								<span>{formatNumber(line.units)}</span>
								<span className={row ? "" : "text-xs"}>
									{row
										? t("points", { points: formatNumber(points) })
										: t("notScored")}
								</span>
							</span>
						</div>
					))
				)}
				{spec.groups.flatMap((group) =>
					(group.unscored ?? []).map((item) => (
						<div
							key={`${group.id}-${item.id}`}
							className="border-line text-muted flex items-start justify-between gap-3 border-t-[1.5px] py-2"
						>
							<span className="flex min-w-0 flex-col">
								<span className="font-semibold">{item.label}</span>
								<span className="text-xs">{item.reason}</span>
							</span>
							<span className="flex flex-col items-end font-mono">
								<span>{formatNumber(item.units)}</span>
								<span className="text-xs">{t("notScored")}</span>
							</span>
						</div>
					))
				)}
				<div className="border-line flex items-baseline justify-between gap-3 border-t-[1.5px] pt-3">
					<span className="font-semibold">{t("addedTo", { event: eventName })}</span>
					<span className="text-primary font-mono font-semibold">
						{t("points", { points: formatNumber(total) })}
					</span>
				</div>
				{!canExport && (
					<Note tone="warning">{t("nothingScores", { event: eventName })}</Note>
				)}
			</Card>

			<Card className="bg-tint flex flex-col gap-2 p-4">
				<h3 className="font-semibold">{t("summaryTitle")}</h3>
				<p className="text-muted text-xs">{t("summaryHint")}</p>
				{CORE_EVENT_IDS.map((id) => (
					<div
						key={id}
						className="border-line flex items-baseline justify-between gap-3 border-t-[1.5px] pt-2 first:border-t-0 first:pt-0"
					>
						<span className="font-semibold">
							{t(`events.${id}`)}
							{id === event && (
								<span className="border-primary text-primary ms-2 rounded-full border px-1.5 text-xs font-normal">
									{t("selected")}
								</span>
							)}
						</span>
						<span className="font-mono">
							{summary[id] > 0
								? t("points", { points: formatNumber(summary[id]) })
								: t("notScored")}
						</span>
					</div>
				))}
			</Card>
		</Flyout>
	);
}
