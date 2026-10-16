"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { EventResultState, Playthrough, UserEventGives, UserEventState } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { dateTimeText, lengthText, rangeText } from "@/service/eventsFormat";
import {
	defaultVersionOf,
	difficultiesOf,
	rankGroupNamesOf,
	rankGroupOf,
	reachedFromScore,
	resultFor,
	resultKindOf,
	rewardLevelOf,
	scoreUnitOf,
	starChangeOf,
	targetsOf,
	tiersWithPlacementOf,
	versionNamesOf,
	waveCountOf,
} from "@/service/eventsResults";
import type { ResultKind } from "@/service/eventsResults";
import {
	DAY_MS,
	endedInstances,
	isDayLong,
	msFromDateTime,
	rollForward,
} from "@/service/eventsSchedule";
import type { EventsZone, RunInstance } from "@/service/eventsSchedule";
import { gameEventById, isCoreGameEvent } from "@/data/game/gameEvents";
import type { GameEvent } from "@/data/game/gameEvents";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { Flyout } from "@/comps/ui/Flyout";
import { Input } from "@/comps/ui/Input";
import { Note } from "@/comps/ui/Note";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Select } from "@/comps/ui/Select";
import { Textarea } from "@/comps/ui/Textarea";
import { FullWidthSegments } from "./FullWidthSegments";
import { NumberField } from "./NumberField";
import { TargetsCard } from "./TargetsCard";

export type ResultTarget = { kind: "new" } | { kind: "edit"; resultId: string };

interface ResultFlyoutProps {
	target: ResultTarget | null;
	chief: Playthrough;
	nowMs: number;
	zone: EventsZone;
	onSave: (result: EventResultState) => boolean;
	onClose: () => void;
}

const OTHER_RUN = "other";
const RUN_OPTIONS = 12;

interface Draft {
	id?: string;
	eventId: string;
	runKey: string;
	otherDate: string;
	tookPart: boolean;
	version?: string;
	score?: number;
	rank?: number;
	allianceRank?: number;
	reached: string[];
	tier: string;
	placement: string;
	outcome: "" | "won" | "lost" | "drawn";
	difficulty: string;
	waves?: number;
	personalPoints?: number;
	alliancePoints?: number;
	rewards: string;
	notes: string;
}

const pickableEvents = (chief: Playthrough, keep: string | undefined): UserEventState[] =>
	(chief.userEvents ?? []).filter(
		(state) => !isCoreGameEvent(state.eventId) || state.eventId === keep
	);

const emptyDraft = (event: GameEvent | undefined, runKey: string): Draft => {
	const tier = event ? tiersWithPlacementOf(event)[0] : undefined;
	return {
		eventId: event?.id ?? "",
		runKey,
		otherDate: "",
		tookPart: true,
		version: event ? defaultVersionOf(event) : undefined,
		reached: [],
		tier: tier?.name ?? "",
		placement: tier?.rankings?.[0]?.groupRanking ?? "",
		outcome: "",
		difficulty: event ? (difficultiesOf(event)[0]?.name ?? "") : "",
		rewards: "",
		notes: "",
	};
};

const loggableRuns = (
	chief: Playthrough,
	state: UserEventState | undefined,
	nowMs: number,
	keepRunStart: string | undefined
): RunInstance[] => {
	if (!state) return [];
	return endedInstances(state, nowMs)
		.filter((instance) => {
			const start = new Date(instance.startMs).toISOString();
			return start === keepRunStart || !resultFor(chief, state.eventId, start);
		})
		.slice(0, RUN_OPTIONS);
};

const draftForNew = (chief: Playthrough, nowMs: number): Draft => {
	const state = pickableEvents(chief, undefined)[0];
	const event = state ? gameEventById(state.eventId) : undefined;
	const first = loggableRuns(chief, state, nowMs, undefined)[0];
	return emptyDraft(event, first ? new Date(first.startMs).toISOString() : OTHER_RUN);
};

const draftOfResult = (result: EventResultState): Draft => {
	const event = gameEventById(result.eventId);
	return {
		...emptyDraft(event, result.runStart),
		id: result.id,
		tookPart: result.tookPart,
		version: result.version ?? (event ? defaultVersionOf(event) : undefined),
		score: result.score,
		rank: result.rank,
		allianceRank: result.allianceRank,
		reached: result.reached ?? [],
		tier: result.tier ?? "",
		placement: result.placement ?? "",
		outcome: result.outcome ?? "",
		difficulty: result.difficulty ?? "",
		waves: result.waves,
		personalPoints: result.personalPoints,
		alliancePoints: result.alliancePoints,
		rewards: (result.rewards ?? []).map((reward) => reward.name).join(", "),
		notes: result.notes ?? "",
	};
};

const runStartOf = (draft: Draft) => {
	if (draft.runKey !== OTHER_RUN) return draft.runKey;
	const ms = msFromDateTime(draft.otherDate, "00:00");
	return Number.isFinite(ms) ? new Date(ms).toISOString() : undefined;
};

const resultOfDraft = (draft: Draft, event: GameEvent, kind: ResultKind, gives: UserEventGives) => {
	const runStart = runStartOf(draft);
	if (!runStart) return undefined;
	const base: EventResultState = {
		id: draft.id ?? crypto.randomUUID(),
		eventId: event.id,
		runStart,
		tookPart: draft.tookPart,
	};
	if (!draft.tookPart) return base;

	const rewards = draft.rewards.trim();
	const notes = draft.notes.trim();
	const common = {
		...base,
		rewards: rewards ? [{ name: rewards }] : undefined,
		notes: notes || undefined,
	};
	const versioned = versionNamesOf(event).length > 0 ? draft.version : undefined;
	const personal = gives === "personal" || gives === "both";
	const alliance = gives === "alliance" || gives === "both";

	if (kind === "milestones") {
		return { ...common, score: draft.score, version: versioned, reached: draft.reached };
	}
	if (kind === "ranking") {
		return {
			...common,
			score: draft.score,
			rank: personal ? draft.rank : undefined,
			allianceRank: alliance ? draft.allianceRank : undefined,
			version: versioned,
			reached: targetsOf(event, draft.version).length > 0 ? draft.reached : undefined,
		};
	}
	if (kind === "tier") {
		return {
			...common,
			tier: draft.tier || undefined,
			placement: draft.placement || undefined,
			outcome: draft.outcome || undefined,
		};
	}
	if (kind === "waves") {
		return {
			...common,
			difficulty: draft.difficulty || undefined,
			waves: draft.waves,
			personalPoints: draft.personalPoints,
			alliancePoints: draft.alliancePoints,
			rank: draft.rank,
			allianceRank: draft.allianceRank,
		};
	}
	return common;
};

export function ResultFlyout({ target, chief, nowMs, zone, onSave, onClose }: ResultFlyoutProps) {
	const t = useTranslations("events");
	const [shownTarget, setShownTarget] = useState<ResultTarget | null>(null);
	const [draft, setDraft] = useState<Draft | null>(null);

	if (target !== shownTarget) {
		setShownTarget(target);
		const saved =
			target?.kind === "edit"
				? (chief.eventResults ?? []).find((item) => item.id === target.resultId)
				: undefined;
		setDraft(!target ? null : saved ? draftOfResult(saved) : draftForNew(chief, nowMs));
	}

	const editing = target?.kind === "edit";
	const event = draft ? gameEventById(draft.eventId) : undefined;
	const state = (chief.userEvents ?? []).find((item) => item.eventId === draft?.eventId);
	const kind = event ? resultKindOf(event) : "participation";
	const gives = state?.gives ?? "rewards";
	const savedRunStart = editing ? draft?.runKey : undefined;
	const eventOptions = pickableEvents(chief, draft?.eventId);
	const runs = loggableRuns(chief, state, nowMs, savedRunStart);
	const result = draft && event ? resultOfDraft(draft, event, kind, gives) : undefined;

	const patch = (changes: Partial<Draft>) => draft && setDraft({ ...draft, ...changes });

	const pickEvent = (eventId: string) => {
		const picked = gameEventById(eventId);
		const pickedState = (chief.userEvents ?? []).find((item) => item.eventId === eventId);
		const first = loggableRuns(chief, pickedState, nowMs, undefined)[0];
		setDraft({
			...emptyDraft(picked, first ? new Date(first.startMs).toISOString() : OTHER_RUN),
			id: draft?.id,
		});
	};

	const runLabel = (instance: RunInstance) => {
		const startText = isDayLong(instance)
			? t("result.runLong", {
					range: rangeText(instance.startMs, instance.endMs, zone),
					length: lengthText({
						length: Math.round((instance.endMs - instance.startMs) / DAY_MS),
						unit: "days",
					}),
				})
			: dateTimeText(instance.startMs, zone);
		const named = instance.label
			? t("result.runNamed", { when: startText, name: instance.label })
			: startText;
		const logged = resultFor(
			chief,
			draft?.eventId ?? "",
			new Date(instance.startMs).toISOString()
		);
		return logged ? named : t("result.notLogged", { run: named });
	};

	const runOptions = (() => {
		const options = runs.map((instance) => ({
			value: new Date(instance.startMs).toISOString(),
			label: runLabel(instance),
		}));
		if (
			draft &&
			draft.runKey !== OTHER_RUN &&
			!options.some((item) => item.value === draft.runKey)
		) {
			options.unshift({
				value: draft.runKey,
				label: dateTimeText(Date.parse(draft.runKey), zone),
			});
		}
		return options;
	})();

	const submit = () => result && onSave(result);

	const versions = event ? versionNamesOf(event) : [];
	const targets = event ? targetsOf(event, draft?.version) : [];
	const unit = (event ? scoreUnitOf(event) : undefined) ?? t("result.pointsFallback");
	const tiers = event ? tiersWithPlacementOf(event) : [];
	const pickedTier = tiers.find((tier) => tier.name === draft?.tier) ?? tiers[0];
	const showPersonal = gives === "personal" || gives === "both";
	const showAlliance = gives === "alliance" || gives === "both";

	const changeScore = (score: number | undefined) =>
		draft &&
		setDraft({ ...draft, score, reached: reachedFromScore(targets, score, draft.reached) });

	const changeVersion = (version: string) =>
		draft &&
		event &&
		setDraft({
			...draft,
			version,
			reached: reachedFromScore(targetsOf(event, version), draft.score, []),
		});

	const rankFields = (
		personalLabel: string,
		allianceLabel: string,
		personal: boolean,
		alliance: boolean
	) =>
		draft &&
		event && (
			<>
				{personal && (
					<>
						<NumberField
							label={personalLabel}
							value={draft.rank}
							optional
							onChange={(rank) => patch({ rank })}
						/>
						<GroupRow
							label={t("result.rankGroup")}
							value={rankGroupOf(event, "personal", draft.rank)}
						/>
					</>
				)}
				{alliance && (
					<>
						<NumberField
							label={allianceLabel}
							value={draft.allianceRank}
							optional
							onChange={(allianceRank) => patch({ allianceRank })}
						/>
						<GroupRow
							label={t("result.rankGroup")}
							value={rankGroupOf(event, "alliance", draft.allianceRank)}
						/>
					</>
				)}
				{(personal || alliance) && (
					<p className="text-muted text-xs">
						{t("result.rankGroupsHint", {
							groups: rankGroupNamesOf(event, personal ? "personal" : "alliance")
								.slice(0, 8)
								.join(", "),
						})}
					</p>
				)}
			</>
		);

	return (
		<Flyout
			open={target !== null}
			onClose={onClose}
			title={event?.name ?? t("result.title")}
			description={t(`result.description.${draft?.tookPart === false ? "skipped" : kind}`)}
			footer={
				<>
					<Button onClick={onClose}>{t("result.cancel")}</Button>
					<Button variant="primary" disabled={!result} onClick={submit}>
						{t("result.save")}
					</Button>
				</>
			}
		>
			{draft && eventOptions.length === 0 && <Note>{t("result.noEvents")}</Note>}
			{draft && eventOptions.length > 0 && (
				<>
					<Card className="flex flex-col gap-3 p-4">
						<h3 className="font-semibold">{t("result.whichTitle")}</h3>
						<Field label={t("result.event")}>
							<Select
								data-autofocus
								value={draft.eventId}
								disabled={editing}
								onChange={(changeEvent) => pickEvent(changeEvent.target.value)}
							>
								{eventOptions.map((option) => (
									<option key={option.eventId} value={option.eventId}>
										{gameEventById(option.eventId)?.name ?? option.eventId}
										{(() => {
											const optionEvent = gameEventById(option.eventId);
											return optionEvent &&
												versionNamesOf(optionEvent).length > 0
												? ` (${t("result.versionsTag")})`
												: "";
										})()}
									</option>
								))}
							</Select>
						</Field>
						<Field label={t("result.run")}>
							<Select
								value={draft.runKey}
								onChange={(changeEvent) =>
									patch({ runKey: changeEvent.target.value })
								}
							>
								{runOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
								<option value={OTHER_RUN}>{t("result.otherDate")}</option>
							</Select>
						</Field>
						{draft.runKey === OTHER_RUN && (
							<Field label={t("result.runDate")}>
								<Input
									type="date"
									className="font-mono"
									value={draft.otherDate}
									onChange={(changeEvent) =>
										patch({ otherDate: changeEvent.target.value })
									}
								/>
							</Field>
						)}
						<div className="flex flex-col gap-1.5">
							<span className="font-medium">{t("result.tookPartQuestion")}</span>
							<FullWidthSegments>
								<SegmentedControl
									label={t("result.tookPartQuestion")}
									value={draft.tookPart ? "took" : "skipped"}
									onChange={(value) => patch({ tookPart: value === "took" })}
									options={[
										{ id: "took", label: t("result.tookPart") },
										{ id: "skipped", label: t("result.skipped") },
									]}
								/>
							</FullWidthSegments>
						</div>
						<p className="text-muted text-xs">{t("result.coreNote")}</p>
					</Card>
					{draft.tookPart && event && (
						<>
							{versions.length > 0 && (
								<Card className="flex flex-col gap-3 p-4">
									<h3 className="font-semibold">{t("result.versionTitle")}</h3>
									<FullWidthSegments>
										<SegmentedControl
											label={t("result.versionTitle")}
											value={draft.version ?? versions[0]}
											onChange={changeVersion}
											options={versions.map((name) => ({
												id: name,
												label: name,
											}))}
										/>
									</FullWidthSegments>
									<p className="text-muted text-xs">
										{targets.every((target) => target.points !== undefined)
											? t("result.versionKnown")
											: t("result.versionUnknown")}
									</p>
								</Card>
							)}
							{kind === "participation" && (
								<Card className="flex flex-col gap-2 p-4">
									<h3 className="font-semibold">
										{t("result.participationTitle")}
									</h3>
									<p className="text-muted">{t("result.participationText")}</p>
								</Card>
							)}
							{kind === "milestones" && (
								<>
									<Card className="flex flex-col gap-3 p-4">
										<h3 className="font-semibold">{unit}</h3>
										<NumberField
											label={t("result.pointsReached", { unit })}
											value={draft.score}
											onChange={changeScore}
											hint={t("result.pointsHint")}
										/>
									</Card>
									<TargetsCard
										targets={targets}
										reached={draft.reached}
										unit={unit}
										onChange={(reached) => patch({ reached })}
									/>
								</>
							)}
							{kind === "ranking" && (
								<>
									<Card className="flex flex-col gap-3 p-4">
										<h3 className="font-semibold">{unit}</h3>
										<NumberField
											label={t("result.finalScore", { unit })}
											value={draft.score}
											onChange={changeScore}
											hint={t("result.finalScoreHint", { unit })}
										/>
									</Card>
									{(showPersonal || showAlliance) && (
										<Card className="flex flex-col gap-3 p-4">
											<h3 className="font-semibold">
												{t("result.rankingTitle")}
											</h3>
											{rankFields(
												t("result.yourRank"),
												t("result.allianceRank"),
												showPersonal,
												showAlliance
											)}
										</Card>
									)}
									{targets.length > 0 && (
										<TargetsCard
											targets={targets}
											reached={draft.reached}
											unit={unit}
											onChange={(reached) => patch({ reached })}
										/>
									)}
								</>
							)}
							{kind === "tier" && (
								<>
									<Card className="flex flex-col gap-3 p-4">
										<h3 className="font-semibold">{t("result.tierTitle")}</h3>
										<Field label={t("result.tier")}>
											<Select
												value={pickedTier?.name ?? ""}
												onChange={(changeEvent) => {
													const next = tiers.find(
														(tier) =>
															tier.name === changeEvent.target.value
													);
													patch({
														tier: changeEvent.target.value,
														placement:
															next?.rankings?.[0]?.groupRanking ?? "",
													});
												}}
											>
												{tiers.map((tier) => (
													<option key={tier.name} value={tier.name}>
														{tier.name}
													</option>
												))}
											</Select>
										</Field>
										<Field label={t("result.placement")}>
											<Select
												value={draft.placement}
												onChange={(changeEvent) =>
													patch({ placement: changeEvent.target.value })
												}
											>
												{(pickedTier?.rankings ?? []).map((ranking) => (
													<option
														key={ranking.groupRanking}
														value={ranking.groupRanking}
													>
														{ranking.groupRanking}
													</option>
												))}
											</Select>
										</Field>
										{(() => {
											const stars = starChangeOf(
												event,
												pickedTier?.name,
												draft.placement
											);
											if (stars === undefined) return null;
											return (
												<GroupRow
													label={t("result.starChange")}
													value={t("result.stars", {
														count: Math.abs(stars),
														amount: `${stars > 0 ? "+" : ""}${formatNumber(stars)}`,
													})}
												/>
											);
										})()}
										<p className="text-muted text-xs">
											{t("result.tiersHint", {
												tiers: tiers.map((tier) => tier.name).join(", "),
											})}
										</p>
									</Card>
									{showAlliance || event.category === "alliance" ? (
										<Card className="flex flex-col gap-3 p-4">
											<h3 className="font-semibold">
												{t("result.allianceTitle")}
											</h3>
											<Field label={t("result.outcome")}>
												<Select
													value={draft.outcome}
													onChange={(changeEvent) =>
														patch({
															outcome: changeEvent.target
																.value as Draft["outcome"],
														})
													}
												>
													<option value="">
														{t("result.outcomes.none")}
													</option>
													<option value="won">
														{t("result.outcomes.won")}
													</option>
													<option value="lost">
														{t("result.outcomes.lost")}
													</option>
													<option value="drawn">
														{t("result.outcomes.drawn")}
													</option>
												</Select>
											</Field>
											<p className="text-muted text-xs">
												{t("result.outcomeHint")}
											</p>
										</Card>
									) : null}
								</>
							)}
							{kind === "waves" && (
								<>
									<Card className="flex flex-col gap-3 p-4">
										<h3 className="font-semibold">{t("result.wavesTitle")}</h3>
										<Field label={t("result.difficulty")}>
											<Select
												value={draft.difficulty}
												onChange={(changeEvent) =>
													patch({ difficulty: changeEvent.target.value })
												}
											>
												{difficultiesOf(event).map((tier) => (
													<option key={tier.name} value={tier.name}>
														{tier.scoreTotal
															? t("result.difficultyFrom", {
																	name: tier.name,
																	points: formatNumber(
																		tier.scoreTotal
																	),
																})
															: tier.name}
													</option>
												))}
											</Select>
										</Field>
										<NumberField
											label={t("result.wavesCleared", {
												count: formatNumber(waveCountOf(event)),
											})}
											value={draft.waves}
											onChange={(waves) =>
												patch({
													waves:
														waves === undefined
															? undefined
															: Math.min(waves, waveCountOf(event)),
												})
											}
											hint={t("result.wavesHint", {
												count: formatNumber(waveCountOf(event)),
												name: event.name,
											})}
										/>
									</Card>
									<Card className="flex flex-col gap-3 p-4">
										<h3 className="font-semibold">
											{t("result.defenseTitle")}
										</h3>
										<div className="grid gap-3 sm:grid-cols-2">
											<NumberField
												label={t("result.yourPoints")}
												value={draft.personalPoints}
												onChange={(personalPoints) =>
													patch({ personalPoints })
												}
											/>
											<NumberField
												label={t("result.alliancePoints")}
												value={draft.alliancePoints}
												onChange={(alliancePoints) =>
													patch({ alliancePoints })
												}
											/>
										</div>
										<GroupRow
											label={t("result.rewardLevel")}
											value={(() => {
												const level = rewardLevelOf(
													event,
													draft.personalPoints,
													draft.alliancePoints
												);
												return level === undefined
													? t("result.rewardLevelNone")
													: t("result.level", {
															level: formatNumber(level),
														});
											})()}
										/>
										<p className="text-muted text-xs">
											{t("result.levelsHint")}
										</p>
									</Card>
									<Card className="flex flex-col gap-3 p-4">
										<h3 className="font-semibold">
											{t("result.rankingsTitle")}
										</h3>
										{rankFields(
											t("result.yourRank"),
											t("result.allianceRank"),
											true,
											true
										)}
									</Card>
								</>
							)}
							<Card className="flex flex-col gap-3 p-4">
								<h3 className="font-semibold">{t("result.notesTitle")}</h3>
								<Field label={t("result.rewards")} optional>
									<Input
										placeholder={t("result.rewardsPlaceholder")}
										value={draft.rewards}
										onChange={(changeEvent) =>
											patch({ rewards: changeEvent.target.value })
										}
									/>
								</Field>
								<Field label={t("result.notes")} optional>
									<Textarea
										placeholder={t("result.notesPlaceholder")}
										value={draft.notes}
										onChange={(changeEvent) =>
											patch({ notes: changeEvent.target.value })
										}
									/>
								</Field>
							</Card>
						</>
					)}
				</>
			)}
		</Flyout>
	);
}

function GroupRow({ label, value }: { label: string; value: string | undefined }) {
	if (value === undefined) return null;

	return (
		<div className="border-line flex items-baseline justify-between gap-3 border-t-[1.5px] pt-2">
			<span className="text-muted">{label}</span>
			<span className="font-mono font-semibold">{value}</span>
		</div>
	);
}
