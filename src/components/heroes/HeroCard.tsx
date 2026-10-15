"use client";

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
							{hero.rarity} · {hero.class} · Gen {hero.generation}
						</span>
					</div>
					<span className="flex items-center gap-2">
						<span className="text-muted text-xs">Owned</span>
						<Switch
							label={`${hero.name} owned`}
							checked={owned}
							onChange={(next) => onChange({ kind: "owned", heroId, owned: next })}
						/>
					</span>
				</div>

				{owned && (
					<>
						<div className="flex flex-col">
							<HeroRow label="Star and tier">
								<ValueStepper
									label={`${hero.name} star`}
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
									empty="No goal"
								/>
							</HeroRow>
							<HeroRow label="Level">
								<ValueStepper
									label={`${hero.name} level`}
									value={view.level}
									min={1}
									max={MAX_HERO_LEVEL}
									suffix={`/ ${MAX_HERO_LEVEL}`}
									onChange={(level) => onChange({ kind: "level", heroId, level })}
								/>
							</HeroRow>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<SkillColumn
								title="Exploration"
								names={exploration.map((skill) => skill.name)}
								view={view}
								onChange={onChange}
							/>
							<SkillColumn
								title="Expedition"
								names={expedition.map((skill) => skill.name)}
								view={view}
								onChange={onChange}
							/>
						</div>

						<div className="flex flex-col">
							{hero.skills.talent && (
								<HeroRow label={`Talent ${hero.skills.talent.name}`}>
									<ValueStepper
										label={`${hero.name} talent`}
										value={view.talent}
										min={1}
										max={MAX_TALENT_LEVEL}
										suffix={`/ ${MAX_TALENT_LEVEL}`}
										onChange={(level) =>
											onChange({ kind: "talent", heroId, level })
										}
									/>
								</HeroRow>
							)}
							{weaponName && (
								<HeroRow label={weaponName}>
									<ValueStepper
										label={`${hero.name} ${weaponName} level`}
										value={view.weapon}
										min={0}
										max={MAX_WEAPON_LEVEL}
										suffix={`/ ${MAX_WEAPON_LEVEL}`}
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
					<HeroRow label="Shards">
						<ShardTile src={hero.shardImg} />
						<ShardsInput
							label={`${hero.name} shards owned`}
							value={view.shards}
							onChange={(shards) => onChange({ kind: "shards", heroId, shards })}
						/>
						{owned && needed > 0 && (
							<span
								className={`font-mono text-xs ${view.shards >= needed ? "text-kept" : "text-warn"}`}
							>
								of {formatNumber(needed)}
								{view.shards >= needed
									? " Enough shards"
									: ` Short by ${formatNumber(needed - view.shards)}`}
							</span>
						)}
					</HeroRow>
					{gearSetNames.length > 0 && (
						<HeroRow label="Gear set">
							<span className="font-medium">{gearSetNames.join(", ")}</span>
						</HeroRow>
					)}
					{owned && (
						<HeroRow label="Total power">
							{power === null ? (
								<span className="text-muted font-mono">Unknown</span>
							) : (
								<span className="font-mono font-medium">{formatNumber(power)}</span>
							)}
						</HeroRow>
					)}
				</div>

				{!owned && (
					<p className="text-muted">Turn on Owned to track star, level and skills.</p>
				)}

				<div className={`grid gap-2 ${owned ? "grid-cols-2" : ""}`}>
					<Button onClick={() => onOpen(heroId)}>Details</Button>
					{owned && (
						<Button variant="secondary" onClick={() => onPlan(heroId)}>
							Plan
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
							label={`${view.hero.name} ${name}`}
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
