"use client";

import { useMemo, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import type { HeroGoal, Playthrough } from "@/types/app";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { HeroPlanResult, HeroView } from "@/service/heroes";
import {
	buildHeroViews,
	formatStars,
	heroPlanChecks,
	initialHeroGoals,
	MAX_STAR_POSITION,
	runHeroPlan,
	shardUse,
	starLabelAt,
	starPosition,
	startingGoalFor,
} from "@/service/heroes";
import { MAX_SKILL_LEVEL, MAX_WEAPON_LEVEL, skillsOf } from "@/data/game/heroes";
import { findItem } from "@/data/game/items";
import { PlanStockCheck } from "@/comps/queues/PlanStockCheck";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { IconButton } from "@/comps/ui/IconButton";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Select } from "@/comps/ui/Select";
import { ValueStepper } from "@/comps/ui/ValueStepper";
import { HeroRow } from "./HeroRows";

interface HeroPlanFlyoutProps {
	open: boolean;
	chief: Playthrough;
	focusHeroId: string | null;
	onClose: () => void;
	onSave: (goals: Record<string, HeroGoal>) => void;
}

type Goals = Record<string, HeroGoal>;

export function HeroPlanFlyout({ open, chief, focusHeroId, onClose, onSave }: HeroPlanFlyoutProps) {
	const [wasOpen, setWasOpen] = useState(false);
	const [goals, setGoals] = useState<Goals>({});

	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
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
			title="Plan Heroes"
			description="Shards, skill manuals and Widgets from current to goal"
			footer={
				<>
					{savedAt && (
						<span className="border-line bg-surface text-muted mr-auto inline-flex h-8 items-center gap-2 rounded-full border-[1.5px] px-3 font-mono text-xs">
							<span aria-hidden="true" className="bg-kept size-1.5 rounded-full" />
							Plan saved {formatDateTime(savedAt)}
						</span>
					)}
					<Button onClick={onClose}>Close</Button>
					<Button variant="primary" onClick={() => onSave(goals)}>
						Save plan
					</Button>
				</>
			}
		>
			<PlanBody chief={chief} goals={goals} onGoalsChange={setGoals} />
		</Flyout>
	);
}

function PlanBody({
	chief,
	goals,
	onGoalsChange,
}: {
	chief: Playthrough;
	goals: Goals;
	onGoalsChange: (goals: Goals) => void;
}) {
	const views = useMemo(() => buildHeroViews(chief), [chief]);
	const plan = useMemo(() => runHeroPlan(chief, goals), [chief, goals]);
	const planned = views.filter((view) => view.owned && goals[view.hero.id]);
	const addable = views.filter((view) => view.owned && !goals[view.hero.id]);

	return (
		<>
			<AddHero
				addable={addable}
				onAdd={(view) => onGoalsChange({ ...goals, [view.hero.id]: startingGoalFor(view) })}
			/>
			{planned.length === 0 ? (
				<Card className="p-4">
					<p className="text-muted">
						No heroes in the plan yet. Add an owned hero above, then raise its goals.
					</p>
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
	const [selectedId, setSelectedId] = useState("");
	const selected = addable.find((view) => view.hero.id === selectedId) ?? addable[0];

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h3 className="font-semibold">Add a hero</h3>
			{!selected ? (
				<p className="text-muted">
					Every owned hero is in the plan. Turn on Owned for a hero to plan it.
				</p>
			) : (
				<div className="flex gap-3">
					<div className="flex-1">
						<Select
							aria-label="Hero to add"
							value={selected.hero.id}
							onChange={(event) => setSelectedId(event.target.value)}
						>
							{addable.map((view) => (
								<option key={view.hero.id} value={view.hero.id}>
									{view.hero.name}
								</option>
							))}
						</Select>
					</div>
					<Button variant="primary" onClick={() => onAdd(selected)}>
						<LuPlus size={16} aria-hidden="true" />
						Add hero
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
							<Badge tone="locked">Gen {hero.generation}</Badge>
						</span>
					</div>
				</div>
				<IconButton
					label={`Remove ${hero.name} from the plan`}
					onClick={onRemove}
					className="text-danger hover:bg-tint"
				>
					<LuTrash2 size={18} aria-hidden="true" />
				</IconButton>
			</div>
			<div className="flex flex-col">
				<HeroRow label="Star and tier">
					<span className="text-muted font-mono text-xs">
						{formatStars(view.stars)} to
					</span>
					<ValueStepper
						label={`${hero.name} star goal`}
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
							<span className="text-muted font-mono text-xs">{current} to</span>
							<ValueStepper
								label={`${hero.name} ${skill.name} goal`}
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
						<span className="text-muted font-mono text-xs">{view.weapon} to</span>
						<ValueStepper
							label={`${hero.name} ${hero.exclusiveWeapon.name} goal`}
							value={Math.max(goal.weapon ?? view.weapon, view.weapon)}
							min={view.weapon}
							max={MAX_WEAPON_LEVEL}
							onChange={(weapon) => onGoalChange({ ...goal, weapon })}
						/>
					</HeroRow>
				)}
			</div>
			<p className="text-muted text-xs">
				Current values come from the hero on the page. Change them there.
			</p>
		</Card>
	);
}

function UnmetCard({ plan }: { plan: HeroPlanResult }) {
	return (
		<Note tone="warning" title="Skill levels need a higher star.">
			{plan.unmet
				.map(
					(item) =>
						`${item.heroName}: ${item.skill} level ${item.level} needs star ${item.starRequired}`
				)
				.join(". ")}
			. Raise the star goal or lower the skill goal.
		</Note>
	);
}

function ShardsUsed({ plan }: { plan: HeroPlanResult }) {
	const use = shardUse(plan);
	if (use.total === 0) return null;

	return (
		<p className="text-muted">
			Shards used: {formatNumber(use.fromOwnHero)} from the hero and{" "}
			{formatNumber(use.fromGeneral)} general, {formatNumber(use.total)} in all. A hero uses
			its own shards first.
		</p>
	);
}

const EVENTS: { key: keyof HeroPlanResult["eventPoints"]; name: string }[] = [
	{ key: "svs", name: "SvS State of Power" },
	{ key: "allianceShowdown", name: "Alliance Showdown" },
	{ key: "kingOfIcefield", name: "King of Icefield" },
	{ key: "hallOfChief", name: "Hall of Chief" },
];

function PlanResult({ plan }: { plan: HeroPlanResult }) {
	const steps = plan.starSteps + plan.skillLevels + plan.weaponLevels;
	const resources = [...plan.resources.entries()];

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h3 className="font-semibold">Result, {formatNumber(steps)} steps</h3>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{resources.map(([itemId, amount]) => {
					const item = findItem(itemId);
					return (
						<div key={itemId} className="flex items-start gap-2">
							<ItemIcon src={item?.img} size={24} />
							<div className="flex flex-col">
								<span className="text-muted text-xs">{item?.name ?? itemId}</span>
								<span className="font-mono font-semibold">
									{formatNumber(amount)}
								</span>
							</div>
						</div>
					);
				})}
				{plan.widgets > 0 && (
					<div className="flex flex-col">
						<span className="text-muted text-xs">Widgets</span>
						<span className="font-mono font-semibold">
							{formatNumber(plan.widgets)}
						</span>
					</div>
				)}
			</div>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[26rem] text-left">
					<thead>
						<tr>
							{["Hero", "Star steps", "Skill levels", "Shards", "Widgets"].map(
								(head) => (
									<th key={head} className="py-1 pr-3">
										<SectionLabel className="text-muted">{head}</SectionLabel>
									</th>
								)
							)}
						</tr>
					</thead>
					<tbody>
						{plan.rows.map((row) => (
							<tr key={row.view.hero.id} className="border-line border-t-[1.5px]">
								<td className="py-1.5 pr-3 font-medium">{row.view.hero.name}</td>
								<td className="pr-3 font-mono">{row.calculation.stars.steps}</td>
								<td className="pr-3 font-mono">{row.calculation.skills.levels}</td>
								<td className="pr-3 font-mono">
									{formatNumber(row.calculation.stars.shards)}
								</td>
								<td className="font-mono">
									{formatNumber(row.calculation.widgets.widgets)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p className="font-mono text-xs">
				{plan.unlockedWeaponSkills} weapon{" "}
				{plan.unlockedWeaponSkills === 1 ? "skill" : "skills"} unlocked
			</p>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{EVENTS.map((event) => (
					<div
						key={event.key}
						className="border-line flex flex-col rounded-md border-[1.5px] p-2"
					>
						<span className="text-muted text-xs">{event.name}</span>
						<span className="font-mono font-semibold">
							{formatNumber(plan.eventPoints[event.key])}
						</span>
					</div>
				))}
			</div>
			<p className="text-muted text-xs">
				Power is not part of Plan Heroes. The calculator returns no time and takes no speed
				input.
			</p>
		</Card>
	);
}
