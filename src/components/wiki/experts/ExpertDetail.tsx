"use client";

import type { Expert, ExpertAffinityLevel, ExpertSkill } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReactNode } from "react";
import { formatDecimal, formatNumber } from "@/lib/format";
import { sumOf } from "@/service/wikiRows";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { RecordSection, RecordTile, RecordTiles } from "../records/RecordParts";
import { RecordTable } from "../records/RecordTable";
import type { RecordColumn } from "../records/RecordTable";
import { UnknownValue } from "../UnknownValue";

interface SkillRow {
	skill: ExpertSkill;
	isTalent: boolean;
}

function SkillSelectButton({
	selected,
	onSelect,
	children,
}: {
	selected: boolean;
	onSelect: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			aria-pressed={selected}
			onClick={onSelect}
			className="flex min-h-11 min-w-11 items-center gap-2 text-start font-semibold hover:underline lg:min-h-9 lg:min-w-9"
		>
			{children}
		</button>
	);
}

export function ExpertDetail({ expert }: { expert: Expert }) {
	const t = useTranslations("wikiExperts.detail");
	const [skillIndex, setSkillIndex] = useState(0);
	const skillRows: SkillRow[] = [
		...expert.skills.map((skill) => ({ skill, isTalent: false })),
		{ skill: expert.talent, isTalent: true },
	];
	const selectedRow = skillRows[skillIndex];

	const bonusText = (bonus: Expert["baseBonuses"][number]) =>
		t("bonus", {
			stat: bonus.stat,
			value:
				bonus.unit === "percent"
					? t("percentValue", { value: formatDecimal(bonus.amount) })
					: formatDecimal(bonus.amount),
		});

	return (
		<div className="flex flex-col gap-6">
			<Card className="flex flex-col gap-4 p-4">
				<div className="flex flex-wrap items-center gap-3">
					<ItemIcon src={expert.img} size={64} />
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<h2 className="text-xl font-semibold">{expert.name}</h2>
						<p className="text-muted">
							{t("subline", {
								title: expert.title,
								specialty: expert.specialty,
								generation: formatNumber(expert.generation),
							})}
						</p>
						<p className="text-muted">
							{expert.unlockRequirement ? (
								t("unlock", {
									days: formatNumber(expert.unlockRequirement.daysRequired),
								})
							) : (
								<UnknownValue />
							)}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						{expert.baseBonuses.map((bonus) => (
							<Badge key={bonus.statKey} tone="kept">
								{t("baseBonus", { bonus: bonusText(bonus) })}
							</Badge>
						))}
					</div>
				</div>
				<RecordTiles>
					<RecordTile value={formatNumber(expert.skills.length)} label={t("skills")} />
					<RecordTile
						value={expert.talent.name}
						label={t("talent", { level: formatNumber(expert.talent.maxLevel) })}
					/>
					<RecordTile
						value={formatNumber(expert.affinityLevels.length)}
						label={t("affinityLevels")}
					/>
					<RecordTile
						value={expert.baseBonuses.map(bonusText).join(", ")}
						label={t("baseBonusLabel")}
					/>
				</RecordTiles>
			</Card>
			<ExpertSkills rows={skillRows} selectedIndex={skillIndex} onSelect={setSkillIndex} />
			<SkillLevels skill={selectedRow.skill} />
			<AffinityLevels levels={expert.affinityLevels} />
		</div>
	);
}

interface ExpertSkillsProps {
	rows: SkillRow[];
	selectedIndex: number;
	onSelect: (index: number) => void;
}

function ExpertSkills({ rows, selectedIndex, onSelect }: ExpertSkillsProps) {
	const t = useTranslations("wikiExperts.skills");
	const costTotal = (row: SkillRow, field: "books" | "exp") =>
		row.skill.costs.length === 0 ? (
			t("none")
		) : (
			<span className="font-mono">
				{formatNumber(sumOf(row.skill.costs.map((cost) => cost[field])))}
			</span>
		);

	const columns: RecordColumn<SkillRow>[] = [
		{
			id: "skill",
			header: t("columns.skill"),
			heading: true,
			cell: (row) => (
				<SkillSelectButton
					selected={rows.indexOf(row) === selectedIndex}
					onSelect={() => onSelect(rows.indexOf(row))}
				>
					{row.isTalent ? t("talent", { name: row.skill.name }) : row.skill.name}
				</SkillSelectButton>
			),
		},
		{
			id: "max",
			header: t("columns.max"),
			cell: (row) => <span className="font-mono">{formatNumber(row.skill.maxLevel)}</span>,
		},
		{ id: "effect", header: t("columns.effect"), cell: (row) => row.skill.description },
		{ id: "books", header: t("columns.books"), cell: (row) => costTotal(row, "books") },
		{ id: "exp", header: t("columns.exp"), cell: (row) => costTotal(row, "exp") },
	];

	return (
		<RecordSection title={t("title")}>
			<p className="text-muted -mt-1">{t("selectHint")}</p>
			<RecordTable
				columns={columns}
				rows={rows}
				rowKey={(row) => row.skill.name}
				isSelected={(row) => rows.indexOf(row) === selectedIndex}
			/>
		</RecordSection>
	);
}

function SkillLevels({ skill }: { skill: ExpertSkill }) {
	const t = useTranslations("wikiExperts.skillLevels");
	const levels = Array.from({ length: skill.maxLevel }, (_, index) => index + 1);
	const costOf = (level: number) => skill.costs.find((cost) => cost.level === level);

	const columns: RecordColumn<number>[] = [
		{
			id: "level",
			header: t("columns.level"),
			heading: true,
			cell: (level) => (
				<span className="font-semibold">{t("level", { level: formatNumber(level) })}</span>
			),
		},
		...skill.progressions.map((progression) => ({
			id: progression.label,
			header: progression.label,
			cell: (level: number) => (
				<span className="font-mono">{formatDecimal(progression.values[level - 1])}</span>
			),
		})),
		{
			id: "exp",
			header: t("columns.exp"),
			cell: (level) => {
				const cost = costOf(level);
				return cost ? (
					<span className="font-mono">{formatNumber(cost.exp)}</span>
				) : (
					t("none")
				);
			},
		},
		{
			id: "books",
			header: t("columns.books"),
			cell: (level) => {
				const cost = costOf(level);
				return cost ? (
					<span className="font-mono">{formatNumber(cost.books)}</span>
				) : (
					t("none")
				);
			},
		},
	];

	return (
		<RecordSection
			title={t("title")}
			meta={t("meta", { name: skill.name, max: formatNumber(skill.maxLevel) })}
		>
			<RecordTable columns={columns} rows={levels} rowKey={String} />
		</RecordSection>
	);
}

function AffinityLevels({ levels }: { levels: ExpertAffinityLevel[] }) {
	const t = useTranslations("wikiExperts.affinity");
	const numberCell = (value: number | undefined) =>
		value === undefined ? (
			<UnknownValue />
		) : (
			<span className="font-mono">{formatNumber(value)}</span>
		);

	const columns: RecordColumn<ExpertAffinityLevel>[] = [
		{
			id: "level",
			header: t("columns.level"),
			heading: true,
			cell: (row) => (
				<span className="font-semibold">
					{t("level", { level: formatNumber(row.level) })}
				</span>
			),
		},
		{
			id: "required",
			header: t("columns.required"),
			cell: (row) => numberCell(row.affinityRequired),
		},
		{
			id: "bonus",
			header: t("columns.bonus"),
			cell: (row) =>
				row.statBonus === undefined ? (
					<UnknownValue />
				) : (
					<span className="font-mono">{formatDecimal(row.statBonus)}</span>
				),
		},
		{
			id: "affinityPower",
			header: t("columns.affinityPower"),
			cell: (row) => numberCell(row.affinityPower),
		},
		{
			id: "levelPower",
			header: t("columns.levelPower"),
			cell: (row) => numberCell(row.levelPower),
		},
		{
			id: "advancement",
			header: t("columns.advancement"),
			cell: (row) =>
				row.advancementCost === undefined
					? t("noAdvancement")
					: numberCell(row.advancementCost),
		},
	];

	return (
		<RecordSection title={t("title")}>
			<RecordTable columns={columns} rows={levels} rowKey={(row) => String(row.level)} />
			<Note>{t("startNote", { start: formatNumber(levels[0].affinityRequired) })}</Note>
		</RecordSection>
	);
}
