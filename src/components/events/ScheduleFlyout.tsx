"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type {
	UserEventGives,
	UserEventRepeat,
	UserEventRun,
	UserEventRunUnit,
	UserEventState,
	UserEventUnit,
} from "@/types/app";
import { formatNumber } from "@/lib/format";
import { rangeText, timeText } from "@/service/eventsFormat";
import {
	dateInputOf,
	instancesBetween,
	msFromDateTime,
	suggestedRepeat,
	timeInputOf,
	WEEKDAY_IDS,
} from "@/service/eventsSchedule";
import type { GameEvent } from "@/data/game/gameEvents";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { CheckChip } from "@/comps/ui/CheckChip";
import { Field } from "@/comps/ui/Field";
import { Flyout } from "@/comps/ui/Flyout";
import { Input } from "@/comps/ui/Input";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Select } from "@/comps/ui/Select";
import { FullWidthSegments } from "./FullWidthSegments";
import { useRepeatText } from "./MyEventsTab";

export interface ScheduleTarget {
	event: GameEvent;
	adding: boolean;
	initial: UserEventState;
}

interface ScheduleFlyoutProps {
	target: ScheduleTarget | null;
	onSave: (state: UserEventState) => void;
	onClose: () => void;
}

interface RunDraft {
	label: string;
	date: string;
	time: string;
	length: string;
	unit: UserEventRunUnit;
}

interface Draft {
	runs: RunDraft[];
	kind: UserEventRepeat["kind"];
	every: string;
	unit: UserEventUnit;
	weekdays: string[];
	gives: UserEventGives;
}

type Shape = "one" | "several" | "two";

const RUN_UNITS: ("minutes" | "hours" | "days")[] = ["minutes", "hours", "days"];
const REPEAT_UNITS: UserEventUnit[] = ["hours", "days", "weeks", "months"];
const GIVES: UserEventGives[] = ["rewards", "personal", "alliance", "both"];
const REPEAT_KINDS: UserEventRepeat["kind"][] = ["none", "every", "weekly"];
const PREVIEW_RUNS = 4;
const PREVIEW_DAYS = 400;
const DAY_MS = 86_400_000;

const draftOfRun = (run: UserEventRun): RunDraft => {
	const startMs = Date.parse(run.startsAt);
	return {
		label: run.label ?? "",
		date: dateInputOf(startMs),
		time: timeInputOf(startMs),
		length: String(run.length),
		unit: run.unit,
	};
};

const draftOf = (state: UserEventState): Draft => ({
	runs: state.runs.map(draftOfRun),
	kind: state.repeat.kind,
	every: String(state.repeat.every ?? 1),
	unit: state.repeat.unit ?? "weeks",
	weekdays: state.repeat.weekdays ?? [],
	gives: state.gives,
});

const runOfDraft = (draft: RunDraft): UserEventRun | undefined => {
	const startMs = msFromDateTime(draft.date, draft.time);
	const length = Number(draft.length);
	if (!Number.isFinite(startMs) || !(length > 0)) return undefined;
	return {
		label: draft.label.trim() || undefined,
		startsAt: new Date(startMs).toISOString(),
		length,
		unit: draft.unit,
	};
};

const repeatOfDraft = (draft: Draft): UserEventRepeat | undefined => {
	if (draft.kind === "none") return { kind: "none" };
	if (draft.kind === "weekly") return { kind: "weekly", weekdays: draft.weekdays };
	const every = Number(draft.every);
	return every > 0 ? { kind: "every", every, unit: draft.unit } : undefined;
};

const shapeOf = (runs: RunDraft[]): Shape => {
	if (runs.length > 1) return "two";
	const [run] = runs;
	return run.unit === "days" && Number(run.length) > 1 ? "several" : "one";
};

const stateOfDraft = (
	draft: Draft,
	eventId: string,
	occurred: UserEventState["occurred"]
): UserEventState | undefined => {
	const runs = draft.runs.map(runOfDraft);
	const repeat = repeatOfDraft(draft);
	if (!repeat || runs.some((run) => run === undefined)) return undefined;
	return { eventId, repeat, runs: runs as UserEventRun[], gives: draft.gives, occurred };
};

export function ScheduleFlyout({ target, onSave, onClose }: ScheduleFlyoutProps) {
	const t = useTranslations("events");
	const repeatText = useRepeatText();
	const [shownTarget, setShownTarget] = useState<ScheduleTarget | null>(null);
	const [draft, setDraft] = useState<Draft | null>(null);

	if (target !== shownTarget) {
		setShownTarget(target);
		setDraft(target ? draftOf(target.initial) : null);
	}

	const state =
		target && draft ? stateOfDraft(draft, target.event.id, target.initial.occurred) : undefined;
	const suggestion = target ? suggestedRepeat(target.event) : undefined;
	const suggestionDiffers =
		suggestion !== undefined &&
		draft !== undefined &&
		draft !== null &&
		repeatText(suggestion) !== repeatText(repeatOfDraft(draft) ?? { kind: "none" });

	const setRun = (index: number, patch: Partial<RunDraft>) =>
		draft &&
		setDraft({
			...draft,
			runs: draft.runs.map((run, at) => (at === index ? { ...run, ...patch } : run)),
		});

	const setShape = (shape: Shape) => {
		if (!draft) return;
		const [first] = draft.runs;
		if (shape === "two") {
			const second: RunDraft = {
				...first,
				label: "",
				date: dateInputOf(msFromDateTime(first.date, first.time) + 7 * DAY_MS),
			};
			setDraft({ ...draft, runs: [first, draft.runs[1] ?? second] });
		} else if (shape === "several") {
			const several = first.unit === "days" && Number(first.length) > 1;
			setDraft({
				...draft,
				runs: [several ? first : { ...first, length: "2", unit: "days" }],
			});
		} else {
			setDraft({ ...draft, runs: [{ ...first, length: "1", unit: "days" }] });
		}
	};

	const toggleWeekday = (id: string, on: boolean) =>
		draft &&
		setDraft({
			...draft,
			weekdays: on ? [...draft.weekdays, id] : draft.weekdays.filter((day) => day !== id),
		});

	const preview = (() => {
		if (!state) return [];
		const first = Math.min(...state.runs.map((run) => Date.parse(run.startsAt)));
		return instancesBetween(state, first, first, first + PREVIEW_DAYS * DAY_MS).slice(
			0,
			PREVIEW_RUNS
		);
	})();

	const shape = draft ? shapeOf(draft.runs) : "one";

	return (
		<Flyout
			open={target !== null}
			onClose={onClose}
			title={target?.event.name ?? ""}
			description={t("schedule.description")}
			footer={
				<>
					<Button onClick={onClose}>{t("schedule.cancel")}</Button>
					<Button
						variant="primary"
						disabled={!state}
						onClick={() => state && onSave(state)}
					>
						{target?.adding ? t("schedule.add") : t("schedule.save")}
					</Button>
				</>
			}
		>
			{target && draft && (
				<>
					<Card className="flex flex-col gap-3 p-4">
						<h3 className="font-semibold">{t("schedule.howTitle")}</h3>
						<FullWidthSegments>
							<SegmentedControl
								label={t("schedule.howTitle")}
								value={shape}
								onChange={setShape}
								options={[
									{ id: "one", label: t("schedule.shape.one") },
									{ id: "several", label: t("schedule.shape.several") },
									{ id: "two", label: t("schedule.shape.two") },
								]}
							/>
						</FullWidthSegments>
						<p className="text-muted text-sm">{t(`schedule.shapeHint.${shape}`)}</p>
					</Card>
					{draft.runs.map((run, index) => (
						<Card key={index} className="flex flex-col gap-3 p-4">
							<h3 className="font-semibold">
								{draft.runs.length > 1
									? t("schedule.runTitle", { number: formatNumber(index + 1) })
									: t("schedule.runSingle")}
							</h3>
							<Field label={t("schedule.name")} optional>
								<Input
									value={run.label}
									onChange={(event) =>
										setRun(index, { label: event.target.value })
									}
								/>
							</Field>
							<div className="grid grid-cols-[minmax(0,1fr)_9.5rem] gap-3">
								<Field label={t("schedule.startDate")}>
									<Input
										type="date"
										className="font-mono"
										value={run.date}
										onChange={(event) =>
											setRun(index, { date: event.target.value })
										}
									/>
								</Field>
								<Field label={t("schedule.startTime")}>
									<Input
										type="time"
										className="font-mono"
										value={run.time}
										onChange={(event) =>
											setRun(index, { time: event.target.value })
										}
									/>
								</Field>
							</div>
							<div className="grid grid-cols-[minmax(0,1fr)_9.5rem] gap-3">
								<Field label={t("schedule.length")}>
									<Input
										inputMode="decimal"
										className="font-mono"
										value={run.length}
										onChange={(event) =>
											setRun(index, {
												length: event.target.value.replace(/[^\d.]/g, ""),
											})
										}
									/>
								</Field>
								<Field label={t("schedule.unit")}>
									<Select
										value={run.unit}
										onChange={(event) =>
											setRun(index, {
												unit: event.target.value as UserEventRunUnit,
											})
										}
									>
										{RUN_UNITS.map((unit) => (
											<option key={unit} value={unit}>
												{t(`schedule.runUnits.${unit}`)}
											</option>
										))}
									</Select>
								</Field>
							</div>
						</Card>
					))}
					<Card className="flex flex-col gap-3 p-4">
						<h3 className="font-semibold">{t("schedule.repeatTitle")}</h3>
						<FullWidthSegments>
							<SegmentedControl
								label={t("schedule.repeatTitle")}
								value={draft.kind}
								onChange={(kind) => setDraft({ ...draft, kind })}
								options={REPEAT_KINDS.map((id) => ({
									id,
									label: t(`schedule.repeatKind.${id}`),
								}))}
							/>
						</FullWidthSegments>
						{draft.kind === "every" && (
							<div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
								<Field label={t("schedule.every")}>
									<Input
										inputMode="decimal"
										className="font-mono"
										value={draft.every}
										onChange={(event) =>
											setDraft({
												...draft,
												every: event.target.value.replace(/[^\d.]/g, ""),
											})
										}
									/>
								</Field>
								<Field label={t("schedule.unit")}>
									<Select
										value={draft.unit}
										onChange={(event) =>
											setDraft({
												...draft,
												unit: event.target.value as UserEventUnit,
											})
										}
									>
										{REPEAT_UNITS.map((unit) => (
											<option key={unit} value={unit}>
												{t(`schedule.repeatUnits.${unit}`)}
											</option>
										))}
									</Select>
								</Field>
							</div>
						)}
						{draft.kind === "weekly" && (
							<div
								role="group"
								aria-label={t("schedule.weekdays")}
								className="flex flex-wrap gap-2"
							>
								{WEEKDAY_IDS.map((id) => (
									<CheckChip
										key={id}
										label={t(`weekdays.short.${id}`)}
										checked={draft.weekdays.includes(id)}
										onChange={(on) => toggleWeekday(id, on)}
									/>
								))}
							</div>
						)}
						{suggestion && target.event.frequency && (
							<div className="flex flex-wrap items-center gap-3">
								<span className="text-muted text-sm">
									{t("schedule.gameSays", { text: target.event.frequency })}
								</span>
								{suggestionDiffers && (
									<Button
										onClick={() =>
											setDraft({
												...draft,
												kind: suggestion.kind,
												every: String(suggestion.every ?? 1),
												unit: suggestion.unit ?? "weeks",
												weekdays: suggestion.weekdays ?? [],
											})
										}
									>
										{t("schedule.useSuggestion")}
									</Button>
								)}
							</div>
						)}
						{!suggestion && target.event.frequency && (
							<span className="text-muted text-sm">
								{t("schedule.gameSaysNoRule", { text: target.event.frequency })}
							</span>
						)}
						{draft.kind === "every" && !(Number(draft.every) > 0) && (
							<p role="alert" className="text-danger text-sm font-medium">
								{t("schedule.everyError")}
							</p>
						)}
					</Card>
					<Card className="flex flex-col gap-3 p-4">
						<h3 className="font-semibold">{t("schedule.givesTitle")}</h3>
						<FullWidthSegments>
							<SegmentedControl
								label={t("schedule.givesTitle")}
								value={draft.gives}
								onChange={(gives) => setDraft({ ...draft, gives })}
								options={GIVES.map((id) => ({ id, label: t(`gives.${id}`) }))}
							/>
						</FullWidthSegments>
						<p className="text-muted text-sm">{t("schedule.givesHint")}</p>
					</Card>
					<Card className="flex flex-col gap-2 p-4">
						<h3 className="font-semibold">{t("schedule.previewTitle")}</h3>
						{preview.length === 0 ? (
							<p className="text-muted">{t("schedule.previewEmpty")}</p>
						) : (
							<ul className="divide-line divide-y-[1.5px]">
								{preview.map((instance) => (
									<li
										key={`${instance.runIndex}-${instance.startMs}`}
										className="flex flex-wrap justify-between gap-x-4 py-2"
									>
										<span>{instance.label ?? target.event.name}</span>
										<span className="font-mono text-sm">
											{instance.endMs - instance.startMs >= DAY_MS
												? rangeText(instance.startMs, instance.endMs, "utc")
												: t("schedule.previewShort", {
														range: rangeText(
															instance.startMs,
															instance.endMs,
															"utc"
														),
														time: timeText(instance.startMs, "utc"),
													})}
										</span>
									</li>
								))}
							</ul>
						)}
						<p className="text-muted text-sm">{t("schedule.previewNote")}</p>
					</Card>
				</>
			)}
		</Flyout>
	);
}
