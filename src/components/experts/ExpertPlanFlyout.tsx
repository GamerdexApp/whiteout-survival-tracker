"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LuPlus } from "react-icons/lu";
import type { ExpertGoalState, Playthrough } from "@/types/app";
import { formatDateTime, formatNumber } from "@/lib/format";
import { expertPlanScores, exportSpecOf } from "@/service/expertExport";
import type { ExpertPlanRow, ExpertsPlan, ExpertView, Goals } from "@/service/experts";
import {
	buildExpertViews,
	expertPlanChecks,
	initialExpertGoals,
	isAdvancementLevel,
	learningMinutesNeeded,
	runExpertsPlan,
	skillGoalCapOf,
	skillGoalGateOf,
	startingGoalFor,
} from "@/service/experts";
import { EXP_PER_LEARNING_MINUTE, MAX_AFFINITY } from "@/data/game/experts";
import { ExportToEventFlyout } from "@/comps/export/ExportToEventFlyout";
import { PlanStockCheck } from "@/comps/queues/PlanStockCheck";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { PlanFooter } from "@/comps/ui/PlanFooter";
import { ScrollRegion } from "@/comps/ui/ScrollRegion";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Select } from "@/comps/ui/Select";
import { Switch } from "@/comps/ui/Switch";
import { ValueStepper } from "@/comps/ui/ValueStepper";

interface ExpertPlanFlyoutProps {
	open: boolean;
	chief: Playthrough;
	onClose: () => void;
	onSave: (goals: Goals) => void;
}

export function ExpertPlanFlyout({ open, chief, onClose, onSave }: ExpertPlanFlyoutProps) {
	const t = useTranslations("experts.plan");
	const [wasOpen, setWasOpen] = useState(false);
	const [goals, setGoals] = useState<Goals>({});
	const [exporting, setExporting] = useState(false);
	const plan = useMemo(() => runExpertsPlan(chief, goals), [chief, goals]);
	const canExport = expertPlanScores(plan);

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) setGoals(initialExpertGoals(chief));
	}

	const savedAt = chief.expertsPlan?.savedAt;

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			description={t("description")}
			footer={
				<PlanFooter
					savedText={savedAt ? t("saved", { date: formatDateTime(savedAt) }) : undefined}
					closeLabel={t("close")}
					onClose={onClose}
					exportAction={{
						disabled: !canExport,
						title: canExport ? undefined : t("exportNothing"),
						onClick: () => setExporting(true),
						label: t("exportButton"),
					}}
					saveLabel={t("save")}
					onSave={() => onSave(goals)}
				/>
			}
		>
			<PlanBody chief={chief} goals={goals} plan={plan} onGoalsChange={setGoals} />
			<ExportToEventFlyout
				open={exporting}
				chief={chief}
				spec={exportSpecOf(plan)}
				onClose={() => setExporting(false)}
			/>
		</Flyout>
	);
}

function PlanBody({
	chief,
	goals,
	plan,
	onGoalsChange,
}: {
	chief: Playthrough;
	goals: Goals;
	plan: ExpertsPlan;
	onGoalsChange: (goals: Goals) => void;
}) {
	const t = useTranslations("experts.plan");
	const views = useMemo(() => buildExpertViews(chief), [chief]);
	const planned = views.filter((view) => view.recruited && goals[view.expert.id]);
	const addable = views.filter((view) => view.recruited && !goals[view.expert.id]);
	const hasRecruited = views.some((view) => view.recruited);

	return (
		<>
			<AddExpert
				addable={addable}
				hasRecruited={hasRecruited}
				onAdd={(view) =>
					onGoalsChange({ ...goals, [view.expert.id]: startingGoalFor(view) })
				}
			/>
			{planned.length === 0 ? (
				<Card className="p-4">
					<p className="text-muted">{t("noExperts")}</p>
				</Card>
			) : (
				planned.map((view) => (
					<ExpertBlock
						key={view.expert.id}
						view={view}
						goal={goals[view.expert.id]}
						onGoalChange={(goal) => onGoalsChange({ ...goals, [view.expert.id]: goal })}
						onRemove={() =>
							onGoalsChange(
								Object.fromEntries(
									Object.entries(goals).filter(([id]) => id !== view.expert.id)
								)
							)
						}
					/>
				))
			)}
			{plan.rows.length > 0 && (
				<>
					<StockSection plan={plan} chief={chief} />
					<ByExpert rows={plan.rows} />
					<PlanResult plan={plan} />
				</>
			)}
		</>
	);
}

function AddExpert({
	addable,
	hasRecruited,
	onAdd,
}: {
	addable: ExpertView[];
	hasRecruited: boolean;
	onAdd: (view: ExpertView) => void;
}) {
	const t = useTranslations("experts.plan.add");
	const [selectedId, setSelectedId] = useState("");
	const selected = addable.find((view) => view.expert.id === selectedId) ?? addable[0];

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{t("title")}</h3>
			{!selected ? (
				<p className="text-muted">{hasRecruited ? t("allIn") : t("noneRecruited")}</p>
			) : (
				<div className="flex gap-3">
					<div className="flex-1">
						<Select
							aria-label={t("selectLabel")}
							value={selected.expert.id}
							onChange={(event) => setSelectedId(event.target.value)}
						>
							{addable.map((view) => (
								<option key={view.expert.id} value={view.expert.id}>
									{view.expert.name}
								</option>
							))}
						</Select>
					</div>
					<Button variant="primary" onClick={() => onAdd(selected)}>
						<LuPlus size={16} aria-hidden="true" />
						{t("button")}
					</Button>
				</div>
			)}
		</Card>
	);
}

function PlanRow({
	label,
	hint,
	current,
	children,
}: {
	label: string;
	hint: string;
	current: string;
	children: React.ReactNode;
}) {
	return (
		<div className="border-line flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-[1.5px] py-2 first:border-t-0">
			<div className="flex min-w-0 flex-col">
				<span>{label}</span>
				<span className="text-muted font-mono text-xs">{hint}</span>
			</div>
			<div className="flex flex-wrap items-center justify-end gap-2">
				<span className="text-muted font-mono text-xs">{current}</span>
				{children}
			</div>
		</div>
	);
}

function ExpertBlock({
	view,
	goal,
	onGoalChange,
	onRemove,
}: {
	view: ExpertView;
	goal: ExpertGoalState;
	onGoalChange: (goal: ExpertGoalState) => void;
	onRemove: () => void;
}) {
	const t = useTranslations("experts.plan.block");
	const tCard = useTranslations("experts.card");
	const { expert } = view;
	const goalAffinity = Math.max(goal.affinity ?? view.affinity, view.affinity);
	const alreadyAdvanced =
		goalAffinity === view.affinity && isAdvancementLevel(view.affinity) && view.advanced;
	const canAdvance = isAdvancementLevel(goalAffinity) && !alreadyAdvanced;
	const setSkill = (index: number, level: number) =>
		onGoalChange({
			...goal,
			skills: view.skillLevels.map((current, position) =>
				position === index ? level : Math.max(goal.skills?.[position] ?? current, current)
			),
		});

	return (
		<Card className="flex flex-col gap-2 p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-3">
					<ItemIcon src={expert.img} size={40} />
					<div className="flex flex-col">
						<h3 className="font-semibold">{expert.name}</h3>
						<span className="text-muted text-xs">{expert.title}</span>
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
			<div className="flex flex-col">
				<PlanRow
					label={t("affinity")}
					hint={t("affinityHeld", { amount: formatNumber(view.affinityAvailable) })}
					current={
						isAdvancementLevel(view.affinity) && view.advanced
							? t("currentAffinity", { level: formatNumber(view.affinity) })
							: t("currentAffinityPlain", { level: formatNumber(view.affinity) })
					}
				>
					<ValueStepper
						label={t("affinityGoalLabel", { expert: expert.name })}
						value={goalAffinity}
						min={view.affinity}
						max={MAX_AFFINITY}
						onChange={(affinity) =>
							onGoalChange({
								...goal,
								affinity,
								advanced: isAdvancementLevel(affinity) ? goal.advanced : false,
							})
						}
					/>
				</PlanRow>
				{canAdvance && (
					<div className="border-line flex items-center justify-between gap-3 border-t-[1.5px] py-2">
						<span>{t("advanceAtGoal", { level: formatNumber(goalAffinity) })}</span>
						<Switch
							label={t("advanceAtGoalLabel", { expert: expert.name })}
							checked={goal.advanced === true}
							onChange={(advanced) => onGoalChange({ ...goal, advanced })}
						/>
					</div>
				)}
				{expert.skills.map((skill, index) => {
					const current = view.skillLevels[index];
					const goalCap = skillGoalCapOf(view, goal, index);
					const gate = skillGoalGateOf(view, goal, index);
					return (
						<div key={skill.name}>
							<PlanRow
								label={skill.name}
								hint={t("expHeld", { amount: formatNumber(view.skillExp[index]) })}
								current={t("currentLevel", { level: formatNumber(current) })}
							>
								<ValueStepper
									label={t("skillGoalLabel", {
										expert: expert.name,
										skill: skill.name,
									})}
									value={Math.max(goal.skills?.[index] ?? current, current)}
									min={current}
									max={goalCap}
									onChange={(level) => setSkill(index, level)}
								/>
							</PlanRow>
							{gate && (
								<p className="text-muted pb-2 font-mono text-xs">
									{gate.level === 1
										? tCard("skillLocked", {
												level: formatNumber(gate.affinity),
											})
										: tCard("skillCapped", {
												next: formatNumber(gate.level),
												level: formatNumber(gate.affinity),
											})}
								</p>
							)}
						</div>
					);
				})}
			</div>
		</Card>
	);
}

function StockSection({ plan, chief }: { plan: ExpertsPlan; chief: Playthrough }) {
	const t = useTranslations("experts.plan.stock");
	const checks = expertPlanChecks(plan, chief);
	const sigilsTotal = plan.total.sigils;
	const sigilsOwn = plan.rows.reduce((sum, row) => sum + row.sigilsFromOwn, 0);
	const held = checks[2].available;
	const expHeld = plan.rows.reduce((sum, row) => sum + row.expHeld, 0);

	return (
		<>
			<PlanStockCheck
				checks={checks}
				timeNote={t("learning", {
					exp: formatNumber(plan.total.exp),
					held: formatNumber(expHeld),
					left: formatNumber(plan.total.exp - expHeld),
					rate: formatNumber(EXP_PER_LEARNING_MINUTE),
					minutes: formatNumber(learningMinutesNeeded(plan)),
				})}
			/>
			<Card className="text-muted flex flex-col gap-1 p-4">
				<p>
					{t("sigils", {
						total: formatNumber(sigilsTotal),
						own: formatNumber(sigilsOwn),
						common: formatNumber(sigilsTotal - sigilsOwn),
					})}
				</p>
				<p>{t("books", { amount: formatNumber(plan.total.books) })}</p>
				<p>
					{t("affinity", {
						needed: formatNumber(plan.total.affinity),
						held: formatNumber(held),
						left: formatNumber(plan.total.affinity - held),
					})}
				</p>
			</Card>
		</>
	);
}

function ByExpert({ rows }: { rows: ExpertPlanRow[] }) {
	const t = useTranslations("experts.plan.byExpert");

	return (
		<div className="flex flex-col gap-2">
			<h3 className="font-semibold">{t("title")}</h3>
			{rows.map((row) => (
				<Card key={row.view.expert.id} className="flex flex-col gap-1 p-3">
					<h4 className="font-semibold">{row.view.expert.name}</h4>
					<p className="font-mono text-xs">
						{t("sigils", {
							needed: formatNumber(row.sigils),
							own: formatNumber(row.sigilsFromOwn),
							name: row.view.expert.name,
							common: formatNumber(row.sigilsFromCommon),
						})}
					</p>
					<p className="font-mono text-xs">
						{t("affinity", {
							needed: formatNumber(row.affinity),
							held: formatNumber(row.affinityHeld),
							left: formatNumber(row.affinity - row.affinityHeld),
						})}
					</p>
					<p className="font-mono text-xs">
						{t("exp", {
							needed: formatNumber(row.exp),
							held: formatNumber(row.expHeld),
							left: formatNumber(row.exp - row.expHeld),
						})}
					</p>
				</Card>
			))}
		</div>
	);
}

const TABLE_HEADS = [
	"expert",
	"books",
	"sigils",
	"exp",
	"levels",
	"advancements",
	"affinity",
] as const;

function PlanResult({ plan }: { plan: ExpertsPlan }) {
	const t = useTranslations("experts.plan.result");
	const tiles = [
		["books", plan.total.books],
		["sigils", plan.total.sigils],
		["exp", plan.total.exp],
		["affinity", plan.total.affinity],
		["advancements", plan.total.advancements],
		["skillLevels", plan.total.skillLevels],
	] as const;

	return (
		<Card className="flex flex-col gap-4 p-4">
			<div className="flex items-center justify-between gap-3">
				<h3 className="font-semibold">{t("title")}</h3>
				<Badge tone="added">{t("derived")}</Badge>
			</div>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{tiles.map(([key, value]) => (
					<div
						key={key}
						className="border-line flex flex-col rounded-md border-[1.5px] p-3"
					>
						<span className="font-mono text-xl font-semibold">
							{formatNumber(value)}
						</span>
						<span className="text-muted text-xs">{t(key)}</span>
					</div>
				))}
			</div>
			<ScrollRegion label={t("tableLabel")}>
				<table className="w-full min-w-120 text-start">
					<thead>
						<tr>
							{TABLE_HEADS.map((head) => (
								<th key={head} className="py-1 pe-3">
									<SectionLabel className="text-muted">
										{t(`heads.${head}`)}
									</SectionLabel>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{plan.rows.map((row) => (
							<tr key={row.view.expert.id} className="border-line border-t-[1.5px]">
								<td className="py-1.5 pe-3 font-medium">{row.view.expert.name}</td>
								<td className="pe-3 font-mono">{formatNumber(row.books)}</td>
								<td className="pe-3 font-mono">{formatNumber(row.sigils)}</td>
								<td className="pe-3 font-mono">{formatNumber(row.exp)}</td>
								<td className="pe-3 font-mono">{formatNumber(row.levels)}</td>
								<td className="pe-3 font-mono">{formatNumber(row.advancements)}</td>
								<td className="font-mono">{formatNumber(row.affinity)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</ScrollRegion>
		</Card>
	);
}
