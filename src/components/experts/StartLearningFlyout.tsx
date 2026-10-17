"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Playthrough } from "@/types/app";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/format";
import { useNow } from "@/lib/hooks/useNow";
import {
	learningTargets,
	sessions,
	sessionWithinRoom,
	startLearning,
} from "@/service/expertLearning";
import { learningJob, secondsFrom } from "@/service/queues";
import { HoursMinutesFields } from "@/comps/queues/HoursMinutesFields";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { Flyout } from "@/comps/ui/Flyout";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Select } from "@/comps/ui/Select";

interface StartLearningFlyoutProps {
	open: boolean;
	chief: Playthrough;
	onClose: () => void;
	onStart: (next: (current: Playthrough) => Playthrough, what: string) => void;
}

type StartMode = "now" | "already";

const startModeIds: StartMode[] = ["now", "already"];

export function StartLearningFlyout({ open, chief, onClose, onStart }: StartLearningFlyoutProps) {
	const t = useTranslations("experts.learning.flyout");
	const names = useTranslations("experts.learning");
	const now = useNow(15_000);
	const [wasOpen, setWasOpen] = useState(false);
	const [expertId, setExpertId] = useState("");
	const [skillIndex, setSkillIndex] = useState(0);
	const [sessionIndex, setSessionIndex] = useState(0);
	const [mode, setMode] = useState<StartMode>("now");
	const [hours, setHours] = useState("");
	const [minutes, setMinutes] = useState("");

	const targets = learningTargets(chief);
	const busy = learningJob(chief);

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			setExpertId(targets[0]?.expertId ?? "");
			setSkillIndex(targets[0]?.skills[0]?.index ?? 0);
			setSessionIndex(0);
			setMode("now");
		}
	}

	const target = targets.find((item) => item.expertId === expertId);
	const skill = target?.skills.find((item) => item.index === skillIndex);
	const chosenSession = sessions[sessionIndex];
	const session = skill ? sessionWithinRoom(chosenSession, skill.room) : chosenSession;
	const ready = Boolean(target && skill) && !busy;
	const sessionSeconds = session.minutes * 60;
	const seconds =
		mode === "now"
			? sessionSeconds
			: Math.min(secondsFrom(Number(hours || 0), Number(minutes || 0)), sessionSeconds);
	const endsAt = new Date(now + seconds * 1_000);

	const chooseExpert = (next: string) => {
		setExpertId(next);
		setSkillIndex(targets.find((item) => item.expertId === next)?.skills[0]?.index ?? 0);
	};

	const chooseSession = (next: number) => {
		setSessionIndex(next);
		if (mode === "already") {
			const adjusted = skill ? sessionWithinRoom(sessions[next], skill.room) : sessions[next];
			fillTimeLeft(adjusted.minutes * 60);
		}
	};

	const fillTimeLeft = (total: number) => {
		setHours(String(Math.floor(total / 3_600)));
		setMinutes(String(Math.floor((total % 3_600) / 60)));
	};

	const chooseMode = (next: StartMode) => {
		setMode(next);
		if (next === "already") fillTimeLeft(sessionSeconds);
	};

	const start = () => {
		if (!target || !skill) return;
		const startedAt = new Date();
		const what = names("jobTitle", {
			expert: target.expertName,
			skill: skill.name,
			session: `${formatNumber(session.exp)} EXP`,
		});
		onStart(
			(current) =>
				startLearning(current, {
					expertId: target.expertId,
					skillIndex: skill.index,
					session,
					startedAt,
					endsAt: new Date(startedAt.getTime() + seconds * 1_000),
				}),
			what
		);
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
					<Button variant="primary" disabled={!ready} onClick={start}>
						{t("start")}
					</Button>
				</>
			}
		>
			{targets.length === 0 ? (
				<Card className="p-4">
					<p className="text-muted">{t("nothingToLearn")}</p>
				</Card>
			) : (
				<>
					<Card className="flex flex-col gap-3 p-4">
						{busy && <p className="text-danger">{t("busy")}</p>}
						<Field label={t("expert")}>
							<Select
								data-autofocus
								value={expertId}
								onChange={(event) => chooseExpert(event.target.value)}
							>
								{targets.map((item) => (
									<option key={item.expertId} value={item.expertId}>
										{item.expertName}
									</option>
								))}
							</Select>
						</Field>
						<Field label={t("skill")}>
							<Select
								value={skillIndex}
								onChange={(event) => setSkillIndex(Number(event.target.value))}
							>
								{target?.skills.map((item) => (
									<option key={item.index} value={item.index}>
										{t("skillOption", {
											name: item.name,
											level: formatNumber(item.level),
											max: formatNumber(item.maxLevel),
										})}
									</option>
								))}
							</Select>
						</Field>
						<Field label={t("session")} hint={t("sessionHint")}>
							<Select
								value={sessionIndex}
								onChange={(event) => chooseSession(Number(event.target.value))}
							>
								{sessions.map((item, index) => (
									<option key={item.label} value={index}>
										{t("sessionOption", {
											label: item.label,
											exp: formatNumber(item.exp),
										})}
									</option>
								))}
							</Select>
						</Field>
					</Card>

					{skill && (
						<Card className="flex flex-col gap-2 p-4">
							<div className="flex justify-between gap-3">
								<span>{t("expEarned")}</span>
								<span className="font-mono">{formatNumber(session.exp)}</span>
							</div>
							<div className="flex justify-between gap-3">
								<span>{t("heldAfter")}</span>
								<span className="font-mono">
									{formatNumber(
										Math.min(skill.held + session.exp, skill.held + skill.room)
									)}
								</span>
							</div>
							{chosenSession.exp > skill.room && (
								<p className="text-muted text-xs">
									{t("tooMuch", {
										room: formatNumber(skill.room),
										time: formatDuration(session.minutes * 60),
									})}
								</p>
							)}
						</Card>
					)}

					<Card className="flex flex-col gap-3 p-4">
						<h3 className="font-semibold">{t("whenStarted")}</h3>
						<SegmentedControl
							label={t("whenStarted")}
							options={startModeIds.map((id) => ({ id, label: t(`modes.${id}`) }))}
							value={mode}
							onChange={chooseMode}
						/>
						{mode === "already" && (
							<>
								<HoursMinutesFields
									hoursLabel={t("timeLeftHours")}
									hours={hours}
									minutes={minutes}
									onChange={(nextHours, nextMinutes) => {
										setHours(nextHours);
										setMinutes(nextMinutes);
									}}
								/>
								<p className="text-muted text-xs">{t("startedHint")}</p>
							</>
						)}
						<div className="border-line flex justify-between gap-3 border-t-[1.5px] pt-2">
							<span>{t("ends")}</span>
							<span className="font-mono">
								{formatDateTime(endsAt.toISOString())}
							</span>
						</div>
					</Card>
				</>
			)}
		</Flyout>
	);
}
