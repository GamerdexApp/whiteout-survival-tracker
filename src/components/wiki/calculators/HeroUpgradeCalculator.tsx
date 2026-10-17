"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";
import {
	DEFAULT_HERO,
	freshInputs,
	heroById,
	heroGroups,
	heroUpgradeGoalOf,
	levelsBetween,
	powerGainOf,
	starPositions,
	starStatsOf,
	weaponLevels,
} from "@/service/calcHeroUpgrade";
import type { HeroUpgradeInputs, LevelRange } from "@/service/calcHeroUpgrade";
import { formatStars, starLabelAt } from "@/service/heroes";
import { calculateHeroUpgrade } from "@/data/game/calcHeroUpgrade";
import type { Hero } from "@/data/game/calcHeroUpgrade";
import { skillsOf } from "@/data/game/heroes";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Select } from "@/comps/ui/Select";
import { useGameLabels } from "../useGameLabels";
import { HeroUpgradeResult } from "./heroupgrade/HeroUpgradeResult";
import { RangeRow } from "./heroupgrade/RangeRow";

interface CalculatorState {
	hero: Hero;
	inputs: HeroUpgradeInputs;
}

const stateFor = (hero: Hero): CalculatorState => ({ hero, inputs: freshInputs(hero) });

const starText = (position: number) => formatStars(starLabelAt(position));

export function HeroUpgradeCalculator() {
	const t = useTranslations("calcHeroUpgrade");
	const [{ hero, inputs }, setState] = useState(() => stateFor(DEFAULT_HERO));
	const result = useMemo(
		() => calculateHeroUpgrade(heroUpgradeGoalOf(hero, inputs)),
		[hero, inputs]
	);
	const setInputs = (next: HeroUpgradeInputs) => setState({ hero, inputs: next });

	return (
		<div className="flex flex-col gap-4">
			<p className="text-muted">{t("intro")}</p>
			<div className="grid items-start gap-4 xl:grid-cols-2">
				<div className="flex min-w-0 flex-col gap-4">
					<HeroCard
						hero={hero}
						onPick={(id) => setState(stateFor(heroById(id)))}
						onReset={() => setState(stateFor(hero))}
					/>
					<InputCard title={t("stars.title")}>
						<RangeRow
							title={t("stars.row")}
							levels={starPositions}
							range={inputs.stars}
							labelOf={starText}
							onChange={(stars) => setInputs({ ...inputs, stars })}
						/>
					</InputCard>
					<SkillsCard
						hero={hero}
						skills={inputs.skills}
						onChange={(name, range) =>
							setInputs({ ...inputs, skills: { ...inputs.skills, [name]: range } })
						}
					/>
					<InputCard title={t("weapon.title")}>
						{hero.exclusiveWeapon ? (
							<RangeRow
								title={
									<>
										<ItemIcon src={hero.exclusiveWeapon.img} size={28} />
										<span className="min-w-0">{hero.exclusiveWeapon.name}</span>
									</>
								}
								levels={weaponLevels}
								range={inputs.widgets}
								labelOf={formatNumber}
								onChange={(widgets) => setInputs({ ...inputs, widgets })}
							/>
						) : (
							<Note>{t("weapon.none", { hero: hero.name })}</Note>
						)}
					</InputCard>
				</div>
				<HeroUpgradeResult
					hero={hero}
					result={result}
					powerGain={powerGainOf(hero, inputs)}
					stats={starStatsOf(hero, inputs.stars)}
				/>
			</div>
		</div>
	);
}

function InputCard({ title, children }: { title: string; children: ReactNode }) {
	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="font-semibold">{title}</h2>
			{children}
		</Card>
	);
}

function HeroCard({
	hero,
	onPick,
	onReset,
}: {
	hero: Hero;
	onPick: (heroId: string) => void;
	onReset: () => void;
}) {
	const t = useTranslations("calcHeroUpgrade.hero");
	const labels = useGameLabels();

	return (
		<Card className="flex flex-col gap-3 p-4">
			<Field label={t("label")}>
				<Select value={hero.id} onChange={(event) => onPick(event.target.value)}>
					{heroGroups.map((group) => (
						<optgroup key={group.rarity} label={labels.rarity(group.rarity)}>
							{group.heroes.map((option) => (
								<option key={option.id} value={option.id}>
									{option.generation > 0
										? t("option", {
												name: option.name,
												generation: formatNumber(option.generation),
											})
										: option.name}
								</option>
							))}
						</optgroup>
					))}
				</Select>
			</Field>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<ItemIcon src={hero.img} size={48} />
					<div className="flex min-w-0 flex-col gap-1">
						<span className="font-semibold">{hero.name}</span>
						<span className="flex flex-wrap gap-1.5">
							<Badge tone="changed">{labels.rarity(hero.rarity)}</Badge>
							<Badge tone="added">{labels.heroClass(hero.class)}</Badge>
							{hero.generation > 0 && (
								<Badge tone="locked">
									{t("generation", { generation: formatNumber(hero.generation) })}
								</Badge>
							)}
						</span>
					</div>
				</div>
				<Button onClick={onReset}>{t("reset")}</Button>
			</div>
		</Card>
	);
}

function SkillsCard({
	hero,
	skills,
	onChange,
}: {
	hero: Hero;
	skills: HeroUpgradeInputs["skills"];
	onChange: (name: string, range: LevelRange) => void;
}) {
	const t = useTranslations("calcHeroUpgrade.skills");
	const branches = (["exploration", "expedition"] as const).map((branch) => ({
		branch,
		skills: skillsOf(hero).filter((entry) => entry.branch === branch),
	}));

	return (
		<InputCard title={t("title")}>
			{branches.map(({ branch, skills: branchSkills }) => (
				<div key={branch} className="flex flex-col gap-3">
					<SectionLabel className="text-muted">{t(branch)}</SectionLabel>
					{branchSkills.map(({ skill }) => (
						<RangeRow
							key={skill.name}
							title={
								<>
									<ItemIcon src={skill.img} size={28} />
									<span className="min-w-0">{skill.name}</span>
								</>
							}
							levels={levelsBetween(1, skill.levels.length)}
							range={skills[skill.name]}
							labelOf={formatNumber}
							onChange={(range) => onChange(skill.name, range)}
						/>
					))}
				</div>
			))}
		</InputCard>
	);
}
