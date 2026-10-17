"use client";

import type { Hero, HeroSkill } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { LuClipboardList } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import type { HeroChange, HeroView } from "@/service/heroes";
import {
	effectiveGoal,
	formatStars,
	furnaceCheck,
	hasStarGoal,
	heroPowerParts,
	MAX_STAR_POSITION,
	shardsNeededForGoal,
	skillGoalOf,
	starLabelAt,
	starPosition,
	weaponGoalOf,
} from "@/service/heroes";
import {
	estimateHeroStats,
	MAX_HERO_LEVEL,
	MAX_SKILL_LEVEL,
	MAX_TALENT_LEVEL,
	MAX_WEAPON_LEVEL,
	widgetCostOf,
} from "@/data/game/heroes";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Flyout } from "@/comps/ui/Flyout";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Switch } from "@/comps/ui/Switch";
import { ValueStepper } from "@/comps/ui/ValueStepper";
import { GoalText, HeroRow, ShardsInput, ShardTile } from "./HeroRows";

type PowerRowId = "levelPower" | "skillPower" | "starPower" | "weaponPower" | "totalPower";

interface HeroFlyoutProps {
	view: HeroView | null;
	chief: Playthrough;
	onChange: (change: HeroChange) => void;
	onPlan: (heroId: string) => void;
	onClose: () => void;
}

export function HeroFlyout({ view, chief, onChange, onPlan, onClose }: HeroFlyoutProps) {
	const t = useTranslations("heroes.flyout");
	const tc = useTranslations("heroes.common");

	return (
		<Flyout
			open={view !== null}
			onClose={onClose}
			title={view?.hero.name ?? t("fallbackTitle")}
			description={
				view
					? t("description", {
							rarity: view.hero.rarity,
							heroClass: view.hero.class,
							generation: formatNumber(view.hero.generation),
						})
					: undefined
			}
			footer={
				<>
					{view?.owned && (
						<Button onClick={() => onPlan(view.hero.id)} className="mr-auto">
							<LuClipboardList
								size={16}
								aria-hidden="true"
								className="max-[359px]:hidden"
							/>
							{tc("plan")}
						</Button>
					)}
					<Button variant="primary" onClick={onClose}>
						{t("done")}
					</Button>
				</>
			}
		>
			{view && <HeroContent view={view} chief={chief} onChange={onChange} />}
		</Flyout>
	);
}

function HeroContent({
	view,
	chief,
	onChange,
}: {
	view: HeroView;
	chief: Playthrough;
	onChange: (change: HeroChange) => void;
}) {
	const tc = useTranslations("heroes.common");
	const { hero } = view;

	return (
		<>
			<Card className="flex items-center gap-3 p-3">
				<ItemIcon src={hero.img} size={56} />
				<div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
					<Badge tone="changed">{hero.rarity}</Badge>
					<Badge tone="added">{hero.class}</Badge>
					<Badge tone="locked">
						{tc("generation", { generation: formatNumber(hero.generation) })}
					</Badge>
					<Badge tone="locked">{hero.subClass}</Badge>
				</div>
				<span className="flex items-center gap-2">
					<span className="text-muted">{tc("owned")}</span>
					<Switch
						label={tc("ownedLabel", { hero: hero.name })}
						checked={view.owned}
						onChange={(owned) => onChange({ kind: "owned", heroId: hero.id, owned })}
					/>
				</span>
			</Card>

			{view.owned && <StatusSection view={view} chief={chief} onChange={onChange} />}
			{view.owned && <SkillsSection view={view} onChange={onChange} />}
			{view.owned && hero.exclusiveWeapon && (
				<WeaponSection view={view} onChange={onChange} />
			)}
			<ShardsSection view={view} onChange={onChange} />
			<StatsSection view={view} />
		</>
	);
}

function Section({
	title,
	aside,
	children,
}: {
	title: string;
	aside?: string;
	children: React.ReactNode;
}) {
	return (
		<Card className="flex flex-col gap-2 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h3 className="font-semibold">{title}</h3>
				{aside && <span className="text-muted text-xs">{aside}</span>}
			</div>
			<div className="flex flex-col">{children}</div>
		</Card>
	);
}

function StatusSection({
	view,
	chief,
	onChange,
}: {
	view: HeroView;
	chief: Playthrough;
	onChange: (change: HeroChange) => void;
}) {
	const t = useTranslations("heroes.flyout.status");
	const tc = useTranslations("heroes.common");
	const { hero } = view;
	const goal = effectiveGoal(view);
	const furnace = furnaceCheck(chief, hero, view.level);
	const power = heroPowerParts(view);

	return (
		<Section title={t("title")}>
			<HeroRow label={tc("starAndTier")}>
				<ValueStepper
					label={tc("starLabel", { hero: hero.name })}
					value={starPosition(view.stars)}
					min={0}
					max={MAX_STAR_POSITION}
					display={formatStars(view.stars)}
					onChange={(position) =>
						onChange({ kind: "stars", heroId: hero.id, stars: starLabelAt(position) })
					}
				/>
				<GoalText
					goal={hasStarGoal(view) && goal ? formatStars(goal) : null}
					empty={tc("noGoal")}
				/>
			</HeroRow>
			<HeroRow label={tc("level")}>
				<ValueStepper
					label={tc("levelLabel", { hero: hero.name })}
					value={view.level}
					min={1}
					max={MAX_HERO_LEVEL}
					suffix={tc("maxLevelSuffix", { max: formatNumber(MAX_HERO_LEVEL) })}
					onChange={(level) => onChange({ kind: "level", heroId: hero.id, level })}
				/>
			</HeroRow>
			<HeroRow label={t("furnaceNeeded", { level: formatNumber(view.level) })}>
				<span className="font-mono">{furnace.requiredLabel}</span>
				<span className={furnace.met ? "text-kept" : "text-warn"}>
					{furnace.met
						? t("met")
						: t("needsFurnace", { required: furnace.requiredLabel })}
				</span>
			</HeroRow>
			{[
				["levelPower", power.level],
				["skillPower", power.skills],
				["starPower", power.star],
				...(hero.exclusiveWeapon ? [["weaponPower", power.weapon]] : []),
				["totalPower", power.total],
			].map(([id, value]) => (
				<HeroRow key={id as string} label={t(id as PowerRowId)}>
					<span
						className={
							value === null ? "text-muted font-mono" : "font-mono font-medium"
						}
					>
						{value === null ? tc("unknown") : formatNumber(value as number)}
					</span>
				</HeroRow>
			))}
			<p className="text-muted text-xs">{t("note")}</p>
		</Section>
	);
}

function SkillRow({
	view,
	skill,
	onChange,
}: {
	view: HeroView;
	skill: HeroSkill;
	onChange: (change: HeroChange) => void;
}) {
	const t = useTranslations("heroes.flyout.skills");
	const tc = useTranslations("heroes.common");
	const level = view.skillLevels[skill.name];
	const next = skill.levels[level];
	const goal = skillGoalOf(view, skill.name);
	const starShort = next !== undefined && view.stars.star < next.starRequired;

	return (
		<div className="border-line flex flex-col gap-1 border-t-[1.5px] py-2 first:border-t-0">
			<div className="flex items-center justify-between gap-3">
				<span className="font-medium">{skill.name}</span>
				<span className="flex items-center gap-2">
					<GoalText goal={goal?.toString() ?? null} />
					<ValueStepper
						label={tc("skillLabel", { hero: view.hero.name, skill: skill.name })}
						value={level}
						min={1}
						max={MAX_SKILL_LEVEL}
						suffix={tc("maxLevelSuffix", { max: formatNumber(MAX_SKILL_LEVEL) })}
						onChange={(next) =>
							onChange({
								kind: "skill",
								heroId: view.hero.id,
								skill: skill.name,
								level: next,
							})
						}
					/>
				</span>
			</div>
			{next && (
				<p className="text-muted flex flex-wrap gap-x-3 font-mono text-xs">
					<span>
						{t("toLevel", {
							level: formatNumber(next.level),
							manuals: formatNumber(next.manualsRequired),
						})}
					</span>
					<span className={starShort ? "text-warn" : "text-kept"}>
						{starShort
							? t("needsStar", { star: formatNumber(next.starRequired) })
							: t("starMet", { star: formatNumber(next.starRequired) })}
					</span>
				</p>
			)}
		</div>
	);
}

function SkillsSection({
	view,
	onChange,
}: {
	view: HeroView;
	onChange: (change: HeroChange) => void;
}) {
	const t = useTranslations("heroes.flyout.skills");
	const tc = useTranslations("heroes.common");
	const { hero } = view;
	const groups = [
		{ id: "exploration", title: tc("exploration"), skills: hero.skills.exploration },
		{ id: "expedition", title: tc("expedition"), skills: hero.skills.expedition },
	];

	return (
		<Section title={t("title")} aside={t("aside")}>
			{groups.map((group) => (
				<div key={group.id} className="flex flex-col pb-2">
					<SectionLabel className="text-muted py-1">{group.title}</SectionLabel>
					{group.skills.map((skill) => (
						<SkillRow key={skill.name} view={view} skill={skill} onChange={onChange} />
					))}
				</div>
			))}
			{hero.skills.talent && (
				<div className="flex flex-col pb-2">
					<SectionLabel className="text-muted py-1">{tc("talent")}</SectionLabel>
					<HeroRow label={hero.skills.talent.name}>
						<ValueStepper
							label={tc("talentLabel", { hero: hero.name })}
							value={view.talent}
							min={1}
							max={MAX_TALENT_LEVEL}
							suffix={tc("maxLevelSuffix", { max: formatNumber(MAX_TALENT_LEVEL) })}
							onChange={(level) =>
								onChange({ kind: "talent", heroId: hero.id, level })
							}
						/>
					</HeroRow>
					<TalentGate view={view} talent={hero.skills.talent} />
				</div>
			)}
		</Section>
	);
}

const widgetsForLevels = (from: number, to: number) =>
	Array.from({ length: Math.max(0, to - from + 1) }, (_, index) =>
		widgetCostOf(from + index)
	).reduce((total, cost) => total + cost, 0);

function WeaponSection({
	view,
	onChange,
}: {
	view: HeroView;
	onChange: (change: HeroChange) => void;
}) {
	const t = useTranslations("heroes.flyout.weapon");
	const tc = useTranslations("heroes.common");
	const { hero, weapon } = view;
	const exclusive = hero.exclusiveWeapon as NonNullable<Hero["exclusiveWeapon"]>;
	const maxed = weapon >= MAX_WEAPON_LEVEL;

	return (
		<Section title={t("title", { name: exclusive.name })}>
			<HeroRow label={t("level")}>
				<ValueStepper
					label={tc("weaponLevelLabel", { hero: hero.name, weapon: exclusive.name })}
					value={weapon}
					min={0}
					max={MAX_WEAPON_LEVEL}
					suffix={tc("maxLevelSuffix", { max: formatNumber(MAX_WEAPON_LEVEL) })}
					onChange={(level) => onChange({ kind: "weapon", heroId: hero.id, level })}
				/>
				<GoalText goal={weaponGoalOf(view)?.toString() ?? null} />
			</HeroRow>
			{!maxed && (
				<>
					<HeroRow label={t("widgetsForLevel", { level: formatNumber(weapon + 1) })}>
						<span className="font-mono">{formatNumber(widgetCostOf(weapon + 1))}</span>
					</HeroRow>
					<HeroRow
						label={t("widgetsForLevels", {
							from: formatNumber(weapon + 1),
							to: formatNumber(MAX_WEAPON_LEVEL),
						})}
					>
						<span className="font-mono">
							{formatNumber(widgetsForLevels(weapon + 1, MAX_WEAPON_LEVEL))}
						</span>
					</HeroRow>
				</>
			)}
			<HeroRow label={t("expeditionBonus")}>
				<span className="font-mono">
					{t("bonus", {
						lethality: formatNumber(exclusive.stats.expedition.lethality),
						health: formatNumber(exclusive.stats.expedition.health),
					})}
				</span>
			</HeroRow>
			<HeroRow label={t("power")}>
				<span className="font-mono">{formatNumber(exclusive.power)}</span>
			</HeroRow>
			<div className="flex flex-col gap-2 pt-2">
				{exclusive.skills.map((skill) => {
					const reached = skill.unlockLevel !== undefined && weapon >= skill.unlockLevel;
					return (
						<div
							key={skill.name}
							className={`border-line rounded-md border-[1.5px] border-dashed p-3 ${reached ? "" : "opacity-70"}`}
						>
							<div className="flex items-baseline justify-between gap-3">
								<span className="font-medium">{skill.name}</span>
								<span className="text-muted font-mono text-xs">
									{skill.unlockLevel === undefined
										? tc("unknown")
										: t("unlocksAt", {
												level: formatNumber(skill.unlockLevel),
											})}
								</span>
							</div>
							<p className="text-muted">{skill.description}</p>
						</div>
					);
				})}
			</div>
		</Section>
	);
}

function ShardsSection({
	view,
	onChange,
}: {
	view: HeroView;
	onChange: (change: HeroChange) => void;
}) {
	const t = useTranslations("heroes.flyout.shards");
	const tc = useTranslations("heroes.common");
	const { hero } = view;
	const needed = shardsNeededForGoal(view);
	const goal = effectiveGoal(view);
	const sources = hero.shardSources;

	return (
		<Section title={t("title")}>
			<HeroRow label={t("owned")}>
				<ShardTile src={hero.shardImg} />
				<ShardsInput
					label={tc("shardsOwnedLabel", { hero: hero.name })}
					value={view.shards}
					onChange={(shards) => onChange({ kind: "shards", heroId: hero.id, shards })}
				/>
			</HeroRow>
			{view.owned && hasStarGoal(view) && goal && (
				<>
					<HeroRow label={t("goal")}>
						<span className="text-primary font-mono">{formatStars(goal)}</span>
					</HeroRow>
					<HeroRow label={t("neededForGoal", { goal: formatStars(goal) })}>
						<span className="font-mono">{formatNumber(needed)}</span>
					</HeroRow>
					<HeroRow label={view.shards >= needed ? t("enough") : t("shortBy")}>
						<span
							className={
								view.shards >= needed
									? "text-kept font-mono"
									: "text-warn font-mono"
							}
						>
							{view.shards >= needed ? t("yes") : formatNumber(needed - view.shards)}
						</span>
					</HeroRow>
				</>
			)}
			<HeroRow label={t("sources")}>
				<span className={sources.length === 0 ? "text-muted" : "text-right"}>
					{sources.length === 0 ? tc("unknown") : sources.join(", ")}
				</span>
			</HeroRow>
		</Section>
	);
}

function StatsSection({ view }: { view: HeroView }) {
	const t = useTranslations("heroes.flyout.stats");
	const { hero, stars } = view;
	const estimate = estimateHeroStats(hero, stars.star, stars.tier);
	const full = hero.stats;

	const rows = [
		{
			label: t("explorationAt", { stars: formatStars(stars) }),
			text: t("exploration", {
				attack: formatNumber(estimate.exploration.attack),
				defense: formatNumber(estimate.exploration.defense),
				health: formatNumber(estimate.exploration.health),
			}),
			estimated: estimate.estimated,
		},
		{
			label: t("expeditionAt", { stars: formatStars(stars) }),
			text: t("expedition", {
				attack: formatNumber(estimate.expedition.attack),
				defense: formatNumber(estimate.expedition.defense),
			}),
			estimated: estimate.estimated,
		},
		{
			label: t("explorationFull"),
			text: t("exploration", {
				attack: formatNumber(full.exploration.attack),
				defense: formatNumber(full.exploration.defense),
				health: formatNumber(full.exploration.health),
			}),
			estimated: false,
		},
		{
			label: t("expeditionFull"),
			text: t("expedition", {
				attack: formatNumber(full.expedition.attack),
				defense: formatNumber(full.expedition.defense),
			}),
			estimated: false,
		},
	].filter((row, index) => index >= 2 || row.estimated || formatStars(stars) !== "5.0");

	return (
		<Section title={t("title")}>
			{rows.map((row) => (
				<HeroRow key={row.label} label={row.label}>
					<span className="font-mono text-xs">{row.text}</span>
					{row.estimated && <Badge tone="changed">{t("estimate")}</Badge>}
				</HeroRow>
			))}
		</Section>
	);
}

function TalentGate({ view, talent }: { view: HeroView; talent: HeroSkill }) {
	const t = useTranslations("heroes.flyout.skills");
	const next = talent.levels[view.talent];
	if (!next) return <p className="text-muted text-xs">{t("talentTop")}</p>;
	const starShort = view.stars.star < next.starRequired;

	return (
		<p className={`font-mono text-xs ${starShort ? "text-warn" : "text-kept"}`}>
			{starShort
				? t("talentNeedsStar", {
						level: formatNumber(next.level),
						star: formatNumber(next.starRequired),
					})
				: t("talentStarMet", {
						level: formatNumber(next.level),
						star: formatNumber(next.starRequired),
					})}
		</p>
	);
}
