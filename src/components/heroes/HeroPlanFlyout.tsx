"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import type { HeroGoal, LuckyWheelPlan, Playthrough } from "@/types/app";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { HeroPlanResult, HeroView } from "@/service/heroes";
import {
	buildHeroViews,
	effectiveLuckyWheel,
	formatStars,
	hasEveryStar,
	heroPlanChecks,
	heroShardRarityOf,
	initialHeroGoals,
	MAX_STAR_POSITION,
	runHeroPlan,
	shardUse,
	starLabelAt,
	starPosition,
	startingGoalFor,
} from "@/service/heroes";
import { exportSpecOf } from "@/service/heroExport";
import { ownedCount } from "@/service/inventory";
import { MAX_SKILL_LEVEL, MAX_WEAPON_LEVEL, skillsOf } from "@/data/game/heroes";
import { findItem } from "@/data/game/items";
import { ExportToEventFlyout } from "@/comps/export/ExportToEventFlyout";
import { PlanStockCheck } from "@/comps/queues/PlanStockCheck";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { IconButton } from "@/comps/ui/IconButton";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { ScrollRegion } from "@/comps/ui/ScrollRegion";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { ValueStepper } from "@/comps/ui/ValueStepper";
import { HeroPicker } from "./HeroPicker";
import { HeroRow } from "./HeroRows";
import { LuckyWheelCard } from "./LuckyWheelCard";

interface HeroPlanFlyoutProps {
	open: boolean;
	chief: Playthrough;
	focusHeroId: string | null;
	onClose: () => void;
	onSave: (goals: Record<string, HeroGoal>, luckyWheel: LuckyWheelPlan | undefined) => void;
}

type Goals = Record<string, HeroGoal>;

const initialWheel = (chief: Playthrough): LuckyWheelPlan =>
	chief.heroesPlan?.luckyWheel ?? {
		heroId: "",
		spins: 0,
		tokens: ownedCount(chief, "lucky-chip"),
	};

/** A wheel with no spins is not saved. */
const savedWheelOf = (
	chief: Playthrough,
	goals: Goals,
	wheel: LuckyWheelPlan
): LuckyWheelPlan | undefined =>
	wheel.spins === 0 ? undefined : effectiveLuckyWheel(chief, goals, wheel);

export function HeroPlanFlyout({ open, chief, focusHeroId, onClose, onSave }: HeroPlanFlyoutProps) {
	const t = useTranslations("heroes.plan");
	const te = useTranslations("heroes.export");
	const [wasOpen, setWasOpen] = useState(false);
	const [goals, setGoals] = useState<Goals>({});
	const [wheel, setWheel] = useState<LuckyWheelPlan>(() => initialWheel(chief));
	const [exportOpen, setExportOpen] = useState(false);
	const exportSpec = exportSpecOf(
		runHeroPlan(chief, goals, effectiveLuckyWheel(chief, goals, wheel))
	);
	const nothingToExport = exportSpec.groups.length === 0;

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			setWheel(initialWheel(chief));
			const initial = initialHeroGoals(chief);
			const focused = buildHeroViews(chief).find((view) => view.hero.id === focusHeroId);
			setGoals(
				focused && focused.owned && !initial[focused.hero.id]
					? { ...initial, [focused.hero.id]: startingGoalFor(focused) }
					: initial
			);
		}
	}

	const savedAt = chief.heroesPlan?.savedAt;

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			description={t("description")}
			footer={
				<div className="flex w-full flex-col gap-2">
					{savedAt && (
						<span className="border-line bg-surface text-muted inline-flex h-8 items-center gap-2 self-start rounded-full border-[1.5px] px-3 font-mono text-xs">
							<span aria-hidden="true" className="bg-kept size-1.5 rounded-full" />
							{t("saved", { date: formatDateTime(savedAt) })}
						</span>
					)}
					<div className="flex flex-nowrap justify-end gap-2 *:min-w-0">
						<Button className="me-auto" onClick={onClose}>
							{t("close")}
						</Button>
						<Button
							disabled={nothingToExport}
							title={nothingToExport ? te("nothing") : undefined}
							onClick={() => setExportOpen(true)}
						>
							{te("button")}
						</Button>
						<Button
							variant="primary"
							onClick={() => onSave(goals, savedWheelOf(chief, goals, wheel))}
						>
							{t("save")}
						</Button>
					</div>
				</div>
			}
		>
			<PlanBody
				chief={chief}
				goals={goals}
				onGoalsChange={setGoals}
				wheel={wheel}
				onWheelChange={setWheel}
			/>
			<ExportToEventFlyout
				open={exportOpen}
				chief={chief}
				spec={exportSpec}
				onClose={() => setExportOpen(false)}
			/>
		</Flyout>
	);
}

function PlanBody({
	chief,
	goals,
	onGoalsChange,
	wheel,
	onWheelChange,
}: {
	chief: Playthrough;
	goals: Goals;
	onGoalsChange: (goals: Goals) => void;
	wheel: LuckyWheelPlan;
	onWheelChange: (wheel: LuckyWheelPlan) => void;
}) {
	const t = useTranslations("heroes.plan");
	const views = useMemo(() => buildHeroViews(chief), [chief]);
	const planned = views.filter((view) => view.owned && goals[view.hero.id]);
	const plan = runHeroPlan(chief, goals, effectiveLuckyWheel(chief, goals, wheel));
	const addable = views.filter(
		(view) => view.owned && !goals[view.hero.id] && !hasEveryStar(view)
	);

	return (
		<>
			<AddHero
				addable={addable}
				onAdd={(view) => onGoalsChange({ ...goals, [view.hero.id]: startingGoalFor(view) })}
			/>
			{planned.length === 0 ? (
				<Card className="p-4">
					<p className="text-muted">{t("noHeroes")}</p>
				</Card>
			) : (
				planned.map((view) => (
					<HeroBlock
						key={view.hero.id}
						view={view}
						goal={goals[view.hero.id]}
						onGoalChange={(goal) => onGoalsChange({ ...goals, [view.hero.id]: goal })}
						onRemove={() => {
							onGoalsChange(
								Object.fromEntries(
									Object.entries(goals).filter(
										([heroId]) => heroId !== view.hero.id
									)
								)
							);
						}}
					/>
				))
			)}
			<LuckyWheelCard plannedViews={planned} wheel={wheel} onChange={onWheelChange} />
			{plan.unmet.length > 0 && <UnmetCard plan={plan} />}
			{plan.rows.length > 0 && (
				<>
					<PlanStockCheck checks={heroPlanChecks(plan, chief)} timeNote="" />
					<ShardsUsed plan={plan} />
					<PlanResult plan={plan} />
				</>
			)}
		</>
	);
}

function AddHero({ addable, onAdd }: { addable: HeroView[]; onAdd: (view: HeroView) => void }) {
	const t = useTranslations("heroes.plan.add");
	const [selectedId, setSelectedId] = useState("");
	const selected = addable.find((view) => view.hero.id === selectedId) ?? addable[0];

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">{t("title")}</h3>
			{!selected ? (
				<p className="text-muted">{t("allIn")}</p>
			) : (
				<div className="flex flex-col gap-3 sm:flex-row">
					<div className="min-w-0 flex-1">
						<HeroPicker
							label={t("selectLabel")}
							views={addable}
							selectedId={selected.hero.id}
							onChange={setSelectedId}
						/>
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

function HeroBlock({
	view,
	goal,
	onGoalChange,
	onRemove,
}: {
	view: HeroView;
	goal: HeroGoal;
	onGoalChange: (goal: HeroGoal) => void;
	onRemove: () => void;
}) {
	const t = useTranslations("heroes.plan.block");
	const tc = useTranslations("heroes.common");
	const { hero } = view;
	const currentPosition = starPosition(view.stars);
	const goalPosition = Math.max(starPosition(goal), currentPosition);
	const setSkill = (name: string, level: number) =>
		onGoalChange({ ...goal, skills: { ...goal.skills, [name]: level } });

	return (
		<Card className="flex flex-col gap-2 p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-3">
					<ItemIcon src={hero.img} size={40} />
					<div className="flex flex-col gap-1">
						<h3 className="font-semibold">{hero.name}</h3>
						<span className="flex flex-wrap gap-1.5">
							<Badge tone="changed">{hero.rarity}</Badge>
							<Badge tone="added">{hero.class}</Badge>
							<Badge tone="locked">
								{tc("generation", { generation: formatNumber(hero.generation) })}
							</Badge>
						</span>
					</div>
				</div>
				<IconButton
					label={t("remove", { hero: hero.name })}
					onClick={onRemove}
					className="text-danger hover:bg-tint"
				>
					<LuTrash2 size={18} aria-hidden="true" />
				</IconButton>
			</div>
			<div className="flex flex-col">
				<HeroRow label={tc("starAndTier")}>
					<span className="text-muted font-mono text-xs">
						{t("starTo", { stars: formatStars(view.stars) })}
					</span>
					<ValueStepper
						label={t("starGoal", { hero: hero.name })}
						value={goalPosition}
						min={currentPosition}
						max={MAX_STAR_POSITION}
						display={formatStars(starLabelAt(goalPosition))}
						onChange={(position) => onGoalChange({ ...goal, ...starLabelAt(position) })}
					/>
				</HeroRow>
				{skillsOf(hero).map(({ skill }) => {
					const current = view.skillLevels[skill.name];
					const target = Math.max(goal.skills?.[skill.name] ?? current, current);
					return (
						<HeroRow key={skill.name} label={skill.name}>
							<span className="text-muted font-mono text-xs">
								{t("levelTo", { current: formatNumber(current) })}
							</span>
							<ValueStepper
								label={t("goalLabel", { hero: hero.name, name: skill.name })}
								value={target}
								min={current}
								max={MAX_SKILL_LEVEL}
								onChange={(level) => setSkill(skill.name, level)}
							/>
						</HeroRow>
					);
				})}
				{hero.exclusiveWeapon && (
					<HeroRow label={hero.exclusiveWeapon.name}>
						<span className="text-muted font-mono text-xs">
							{t("levelTo", { current: formatNumber(view.weapon) })}
						</span>
						<ValueStepper
							label={t("goalLabel", {
								hero: hero.name,
								name: hero.exclusiveWeapon.name,
							})}
							value={Math.max(goal.weapon ?? view.weapon, view.weapon)}
							min={view.weapon}
							max={MAX_WEAPON_LEVEL}
							onChange={(weapon) => onGoalChange({ ...goal, weapon })}
						/>
					</HeroRow>
				)}
			</div>
			<p className="text-muted text-xs">{t("note")}</p>
		</Card>
	);
}

function UnmetCard({ plan }: { plan: HeroPlanResult }) {
	const t = useTranslations("heroes.plan.unmet");
	const items = plan.unmet.map((item) =>
		t("item", {
			hero: item.heroName,
			skill: item.skill,
			level: formatNumber(item.level),
			star: formatNumber(item.starRequired),
		})
	);

	return (
		<Note tone="warning" title={t("title")}>
			{t("message", { items: items.join(". ") })}
		</Note>
	);
}

function ShardsUsed({ plan }: { plan: HeroPlanResult }) {
	const t = useTranslations("heroes.plan");
	const use = shardUse(plan);
	if (use.total === 0) return null;

	return (
		<p className="text-muted">
			{t("shardsUsed", {
				own: formatNumber(use.fromOwnHero),
				general: formatNumber(use.fromGeneral),
				total: formatNumber(use.total),
			})}
		</p>
	);
}

const EVENT_KEYS: (keyof HeroPlanResult["eventPoints"])[] = [
	"svs",
	"allianceShowdown",
	"kingOfIcefield",
	"hallOfChief",
];

const TABLE_HEADS = ["hero", "starSteps", "skillLevels", "shards", "widgets"] as const;

function PlanResult({ plan }: { plan: HeroPlanResult }) {
	const t = useTranslations("heroes.plan");
	const te = useTranslations("heroes.export");
	const steps = plan.starSteps + plan.skillLevels + plan.weaponLevels;
	const resources = [...plan.resources.entries()];

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h3 className="font-semibold">{t("result.title", { steps: formatNumber(steps) })}</h3>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{resources.map(([itemId, amount]) => {
					const item = findItem(itemId);
					const shardRarity = heroShardRarityOf(itemId);
					return (
						<div key={itemId} className="flex items-start gap-2">
							<ItemIcon src={item?.img} size={24} />
							<div className="flex flex-col">
								<span className="text-muted text-xs">
									{shardRarity
										? te(`shards.${shardRarity}`)
										: (item?.name ?? itemId)}
								</span>
								<span className="font-mono font-semibold">
									{formatNumber(amount)}
								</span>
							</div>
						</div>
					);
				})}
				{plan.widgets > 0 && (
					<div className="flex flex-col">
						<span className="text-muted text-xs">{t("result.widgets")}</span>
						<span className="font-mono font-semibold">
							{formatNumber(plan.widgets)}
						</span>
					</div>
				)}
			</div>
			<ScrollRegion label={t("result.tableLabel")}>
				<table className="w-full min-w-104 text-start">
					<thead>
						<tr>
							{TABLE_HEADS.map((head) => (
								<th key={head} className="py-1 pe-3">
									<SectionLabel className="text-muted">
										{t(`result.heads.${head}`)}
									</SectionLabel>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{plan.rows.map((row) => (
							<tr key={row.view.hero.id} className="border-line border-t-[1.5px]">
								<td className="py-1.5 pe-3 font-medium">{row.view.hero.name}</td>
								<td className="pe-3 font-mono">{row.calculation.stars.steps}</td>
								<td className="pe-3 font-mono">{row.calculation.skills.levels}</td>
								<td className="pe-3 font-mono">
									{formatNumber(row.calculation.stars.shards)}
								</td>
								<td className="font-mono">
									{formatNumber(row.calculation.widgets.widgets)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</ScrollRegion>
			<p className="font-mono text-xs">
				{t("result.weaponSkills", {
					count: plan.unlockedWeaponSkills,
					amount: formatNumber(plan.unlockedWeaponSkills),
				})}
			</p>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{EVENT_KEYS.map((key) => (
					<div
						key={key}
						className="border-line flex flex-col rounded-md border-[1.5px] p-2"
					>
						<span className="text-muted text-xs">{t(`events.${key}`)}</span>
						<span className="font-mono font-semibold">
							{formatNumber(plan.eventPoints[key])}
						</span>
					</div>
				))}
			</div>
			<p className="text-muted text-xs">{t("result.note")}</p>
		</Card>
	);
}
