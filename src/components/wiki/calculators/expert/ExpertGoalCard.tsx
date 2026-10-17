"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";
import type { ExpertDraft } from "@/service/calcExpert";
import {
	canAdvanceAtGoal,
	levelsFrom,
	withAdvanced,
	withAffinityCurrent,
	withAffinityGoal,
	withSkillCurrent,
	withSkillGoal,
} from "@/service/calcExpert";
import { EXPERT_MAX_LEVEL, isAdvancementLevel } from "@/data/game/calcExpert";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { Switch } from "@/comps/ui/Switch";

interface ExpertGoalCardProps {
	draft: ExpertDraft;
	onChange: (draft: ExpertDraft) => void;
	onRemove: () => void;
}

export function ExpertGoalCard({ draft, onChange, onRemove }: ExpertGoalCardProps) {
	const t = useTranslations("calcExpert.expert");
	const { expert, level } = draft;

	return (
		<Card className="flex flex-col gap-4 p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<ItemIcon src={expert.img} size={40} />
					<div className="flex min-w-0 flex-col">
						<h3 className="font-semibold">{expert.name}</h3>
						<span className="text-muted text-xs">
							{t("meta", { title: expert.title, specialty: expert.specialty })}
						</span>
					</div>
				</div>
				<Button
					variant="danger"
					aria-label={t("removeLabel", { expert: expert.name })}
					onClick={onRemove}
				>
					{t("remove")}
				</Button>
			</div>
			<RangeGroup
				legend={<span className="font-medium">{t("affinity")}</span>}
				current={level.current}
				goal={level.goal}
				max={EXPERT_MAX_LEVEL}
				onCurrent={(value) => onChange(withAffinityCurrent(draft, value))}
				onGoal={(value) => onChange(withAffinityGoal(draft, value))}
				currentExtra={
					isAdvancementLevel(expert, level.current) && (
						<AdvancedSwitch
							text={t("advancedAtCurrent", { level: formatNumber(level.current) })}
							checked={level.currentAdvanced}
							onChange={(advanced) =>
								onChange(withAdvanced(draft, "currentAdvanced", advanced))
							}
						/>
					)
				}
				goalExtra={
					canAdvanceAtGoal(expert, level) && (
						<AdvancedSwitch
							text={t("advanceAtGoal", { level: formatNumber(level.goal) })}
							checked={level.goalAdvanced}
							onChange={(advanced) =>
								onChange(withAdvanced(draft, "goalAdvanced", advanced))
							}
						/>
					)
				}
			/>
			{expert.skills.map((skill, index) => (
				<RangeGroup
					key={skill.name}
					legend={
						<span className="flex items-center gap-2">
							<ItemIcon src={skill.img} size={28} />
							<span className="font-medium">{skill.name}</span>
							<span className="text-muted font-mono text-xs">
								{t("skillMax", { level: formatNumber(skill.maxLevel) })}
							</span>
						</span>
					}
					current={draft.skills[index].current}
					goal={draft.skills[index].goal}
					max={skill.maxLevel}
					onCurrent={(value) => onChange(withSkillCurrent(draft, index, value))}
					onGoal={(value) => onChange(withSkillGoal(draft, index, value))}
				/>
			))}
		</Card>
	);
}

function RangeGroup({
	legend,
	current,
	goal,
	max,
	onCurrent,
	onGoal,
	currentExtra,
	goalExtra,
}: {
	legend: ReactNode;
	current: number;
	goal: number;
	max: number;
	onCurrent: (level: number) => void;
	onGoal: (level: number) => void;
	currentExtra?: ReactNode;
	goalExtra?: ReactNode;
}) {
	const t = useTranslations("calcExpert.expert");

	return (
		<fieldset className="border-line flex min-w-0 flex-col gap-2 border-t-[1.5px] pt-3">
			<legend className="float-start mb-2 w-full">{legend}</legend>
			<div className="grid grid-cols-2 gap-3">
				<div className="flex min-w-0 flex-col gap-2">
					<Field label={t("current")}>
						<LevelSelect
							levels={levelsFrom(1, max)}
							value={current}
							onChange={onCurrent}
						/>
					</Field>
					{currentExtra}
				</div>
				<div className="flex min-w-0 flex-col gap-2">
					<Field label={t("goal")}>
						<LevelSelect
							levels={levelsFrom(current, max)}
							value={goal}
							onChange={onGoal}
						/>
					</Field>
					{goalExtra}
				</div>
			</div>
		</fieldset>
	);
}

function LevelSelect({
	levels,
	value,
	onChange,
}: {
	levels: number[];
	value: number;
	onChange: (level: number) => void;
}) {
	return (
		<Select
			value={value}
			onChange={(event) => onChange(Number(event.target.value))}
			className="font-mono"
		>
			{levels.map((level) => (
				<option key={level} value={level}>
					{formatNumber(level)}
				</option>
			))}
		</Select>
	);
}

function AdvancedSwitch({
	text,
	checked,
	onChange,
}: {
	text: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	const labelId = useId();

	return (
		<div className="flex items-center justify-between gap-2">
			<span id={labelId} className="text-xs">
				{text}
			</span>
			<Switch checked={checked} onChange={onChange} labelledBy={labelId} />
		</div>
	);
}
