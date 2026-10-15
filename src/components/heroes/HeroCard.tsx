"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { HeroChange, HeroView } from "@/service/heroes";
import {
	effectiveGoal,
	formatStars,
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
	MAX_HERO_LEVEL,
	MAX_SKILL_LEVEL,
	MAX_TALENT_LEVEL,
	MAX_WEAPON_LEVEL,
} from "@/data/game/heroes";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Switch } from "@/comps/ui/Switch";
import { ValueStepper } from "@/comps/ui/ValueStepper";
import { GoalText, HeroRow, ShardsInput, ShardTile } from "./HeroRows";

interface HeroCardProps {
	view: HeroView;
	onChange: (change: HeroChange) => void;
	onOpen: (heroId: string) => void;
	onPlan: (heroId: string) => void;
	gearSetNames: string[];
}

export function HeroCard({ view, onChange, onOpen, onPlan, gearSetNames }: HeroCardProps) {
	const t = useTranslations("heroes");
	const { hero, owned } = view;
	const heroId = hero.id;
	const exploration = hero.skills.exploration;
	const expedition = hero.skills.expedition;
	const weaponName = hero.exclusiveWeapon?.name;
	const power = heroPowerParts(view).total;
	const goal = effectiveGoal(view);
	const needed = shardsNeededForGoal(view);

	return (
		<li>
			<Card className="flex flex-col gap-3 p-3">
				<div className="flex items-center gap-3">
					<ItemIcon src={hero.img} size={44} />
					<div className="flex min-w-0 flex-1 flex-col">
						<h3 className="truncate font-semibold">{hero.name}</h3>
						<span className="text-muted font-mono text-xs">
							{t("card.summary", {
								rarity: hero.rarity,
								heroClass: hero.class,
								generation: t("common.generation", {
									generation: formatNumber(hero.generation),
								}),
							})}
						</span>
					</div>
					<span className="flex items-center gap-2">
						<span className="text-muted text-xs">{t("common.owned")}</span>
						<Switch
							label={t("common.ownedLabel", { hero: hero.name })}
							checked={owned}
							onChange={(next) => onChange({ kind: "owned", heroId, owned: next })}
						/>
					</span>
				</div>

				{owned && (
					<>
						<div className="flex flex-col">
							<HeroRow label={t("common.starAndTier")}>
								<ValueStepper
									label={t("common.starLabel", { hero: hero.name })}
									value={starPosition(view.stars)}
									min={0}
									max={MAX_STAR_POSITION}
									display={formatStars(view.stars)}
									onChange={(position) =>
										onChange({
											kind: "stars",
											heroId,
											stars: starLabelAt(position),
										})
									}
								/>
								<GoalText
									goal={
										hasStarGoal(view) && goal
											? formatStars({ star: goal.star, tier: goal.tier })
											: null
									}
									empty={t("common.noGoal")}
								/>
							</HeroRow>
							<HeroRow label={t("common.level")}>
								<ValueStepper
									label={t("common.levelLabel", { hero: hero.name })}
									value={view.level}
									min={1}
									max={MAX_HERO_LEVEL}
									suffix={t("common.maxLevelSuffix", {
										max: formatNumber(MAX_HERO_LEVEL),
									})}
									onChange={(level) => onChange({ kind: "level", heroId, level })}
								/>
							</HeroRow>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<SkillColumn
								title={t("common.exploration")}
								names={exploration.map((skill) => skill.name)}
								view={view}
								onChange={onChange}
							/>
							<SkillColumn
								title={t("common.expedition")}
								names={expedition.map((skill) => skill.name)}
								view={view}
								onChange={onChange}
							/>
						</div>

						<div className="flex flex-col">
							{hero.skills.talent && (
								<HeroRow
									label={t("card.talentRow", { name: hero.skills.talent.name })}
								>
									<ValueStepper
										label={t("common.talentLabel", { hero: hero.name })}
										value={view.talent}
										min={1}
										max={MAX_TALENT_LEVEL}
										suffix={t("common.maxLevelSuffix", {
											max: formatNumber(MAX_TALENT_LEVEL),
										})}
										onChange={(level) =>
											onChange({ kind: "talent", heroId, level })
										}
									/>
								</HeroRow>
							)}
							{weaponName && (
								<HeroRow label={weaponName}>
									<ValueStepper
										label={t("common.weaponLevelLabel", {
											hero: hero.name,
											weapon: weaponName,
										})}
										value={view.weapon}
										min={0}
										max={MAX_WEAPON_LEVEL}
										suffix={t("common.maxLevelSuffix", {
											max: formatNumber(MAX_WEAPON_LEVEL),
										})}
										onChange={(level) =>
											onChange({ kind: "weapon", heroId, level })
										}
									/>
									<GoalText goal={weaponGoalOf(view)?.toString() ?? null} />
								</HeroRow>
							)}
						</div>
					</>
				)}

				<div className="flex flex-col">
					<HeroRow label={t("common.shards")}>
						<ShardTile src={hero.shardImg} />
						<ShardsInput
							label={t("common.shardsOwnedLabel", { hero: hero.name })}
							value={view.shards}
							onChange={(shards) => onChange({ kind: "shards", heroId, shards })}
						/>
						{owned && needed > 0 && (
							<span
								className={`font-mono text-xs ${view.shards >= needed ? "text-kept" : "text-warn"}`}
							>
								{t("card.shardsOf", { needed: formatNumber(needed) })}
								{view.shards >= needed
									? t("card.enoughShards")
									: t("card.shortBy", {
											amount: formatNumber(needed - view.shards),
										})}
							</span>
						)}
					</HeroRow>
					{gearSetNames.length > 0 && (
						<HeroRow label={t("card.gearSet")}>
							<span className="font-medium">{gearSetNames.join(", ")}</span>
						</HeroRow>
					)}
					{owned && (
						<HeroRow label={t("common.totalPower")}>
							{power === null ? (
								<span className="text-muted font-mono">{t("common.unknown")}</span>
							) : (
								<span className="font-mono font-medium">{formatNumber(power)}</span>
							)}
						</HeroRow>
					)}
				</div>

				{!owned && <p className="text-muted">{t("card.notOwnedHint")}</p>}

				<div className={`grid gap-2 ${owned ? "grid-cols-2" : ""}`}>
					<Button onClick={() => onOpen(heroId)}>{t("card.details")}</Button>
					{owned && (
						<Button variant="secondary" onClick={() => onPlan(heroId)}>
							{t("common.plan")}
						</Button>
					)}
				</div>
			</Card>
		</li>
	);
}

function SkillColumn({
	title,
	names,
	view,
	onChange,
}: {
	title: string;
	names: string[];
	view: HeroView;
	onChange: (change: HeroChange) => void;
}) {
	const t = useTranslations("heroes.common");

	return (
		<div className="flex flex-col">
			<SectionLabel className="text-muted pb-1">{title}</SectionLabel>
			{names.map((name) => {
				const goal = skillGoalOf(view, name);
				return (
					<div
						key={name}
						className="border-line flex min-h-9 items-center justify-between gap-2 border-t-[1.5px] py-1 first:border-t-0"
					>
						<span className="min-w-0 flex-1 truncate" title={name}>
							{name}
						</span>
						<GoalText goal={goal?.toString() ?? null} />
						<ValueStepper
							label={t("skillLabel", { hero: view.hero.name, skill: name })}
							value={view.skillLevels[name]}
							min={1}
							max={MAX_SKILL_LEVEL}
							onChange={(level) =>
								onChange({
									kind: "skill",
									heroId: view.hero.id,
									skill: name,
									level,
								})
							}
						/>
					</div>
				);
			})}
		</div>
	);
}
