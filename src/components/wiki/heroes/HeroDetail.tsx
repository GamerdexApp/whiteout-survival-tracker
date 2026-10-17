"use client";

import type { Hero } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { formatDecimal, formatNumber } from "@/lib/format";
import { MAX_HERO_LEVEL } from "@/data/game/heroes";
import { widgetLevels } from "@/data/game/wikiHeroes";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Note } from "@/comps/ui/Note";
import { KnownNumber, RecordSection, RecordTile, RecordTiles } from "../records/RecordParts";
import { RecordTable } from "../records/RecordTable";
import type { RecordColumn } from "../records/RecordTable";
import { UnknownValue } from "../UnknownValue";
import { useGameLabels } from "../useGameLabels";

const FIRST_GENERATION_WITHOUT_POWER = 6;

const joinNumbers = (values: number[]) => values.map(formatNumber).join(" · ");

export function HeroDetail({ hero }: { hero: Hero }) {
	const t = useTranslations("wikiHeroes");
	const labels = useGameLabels();
	const levelPower = hero.levels.find((level) => level.level === MAX_HERO_LEVEL)?.power;
	const fiveStarPower = hero.shardCosts.at(-1)?.power;

	return (
		<div className="flex flex-col gap-6">
			{hero.generation >= FIRST_GENERATION_WITHOUT_POWER && (
				<Note>{t("detail.powerMissing")}</Note>
			)}
			<Card className="flex flex-col gap-4 p-4">
				<div className="flex items-center gap-3">
					<ItemIcon src={hero.img} size={64} />
					<div className="flex min-w-0 flex-col gap-2">
						<h2 className="text-xl font-semibold">{hero.name}</h2>
						<div className="flex flex-wrap gap-2">
							<Badge tone="changed">{labels.rarity(hero.rarity)}</Badge>
							<Badge tone="kept">{labels.heroClass(hero.class)}</Badge>
							<Badge tone="kept">{labels.subClass(hero.subClass)}</Badge>
							<Badge tone="kept">
								{t("detail.generation", {
									generation: formatNumber(hero.generation),
								})}
							</Badge>
						</div>
						<p className="text-muted">
							{hero.shardSources.length > 0
								? t("detail.source", { sources: hero.shardSources.join(", ") })
								: t("detail.noSource")}
						</p>
					</div>
				</div>
				<RecordTiles>
					<RecordTile
						value={formatNumber(hero.stats.exploration.attack)}
						label={t("detail.explorationAttack")}
					/>
					<RecordTile
						value={formatNumber(hero.stats.exploration.defense)}
						label={t("detail.explorationDefense")}
					/>
					<RecordTile
						value={formatNumber(hero.stats.exploration.health)}
						label={t("detail.explorationHealth")}
					/>
					<RecordTile
						value={formatDecimal(hero.stats.expedition.attack)}
						label={t("detail.expeditionAttack")}
					/>
					<RecordTile
						value={formatDecimal(hero.stats.expedition.defense)}
						label={t("detail.expeditionDefense")}
					/>
					<RecordTile
						value={<KnownNumber value={levelPower} />}
						label={t("detail.powerAtLevel80")}
					/>
					<RecordTile
						value={<KnownNumber value={fiveStarPower} />}
						label={t("detail.powerAtFiveStars")}
					/>
					<RecordTile
						value={<KnownNumber value={hero.powerAtStarZero} />}
						label={t("detail.powerAtZeroStars")}
					/>
				</RecordTiles>
			</Card>
			<HeroSkills hero={hero} />
			<HeroShards hero={hero} />
			<HeroWeapon hero={hero} />
			<HeroLevels hero={hero} />
		</div>
	);
}

type HeroSkill = Hero["skills"]["exploration"][number];
type SkillLevel = HeroSkill["levels"][number];
type SkillBranch = "exploration" | "expedition" | "talent";

function HeroSkills({ hero }: { hero: Hero }) {
	const t = useTranslations("wikiHeroes.skills");
	const total =
		hero.skills.exploration.length +
		hero.skills.expedition.length +
		(hero.skills.talent ? 1 : 0);

	return (
		<RecordSection
			title={t("title")}
			meta={t("count", { count: total, amount: formatNumber(total) })}
		>
			<div className="grid items-start gap-6 xl:grid-cols-2">
				<SkillBranchColumn branch="exploration" skills={hero.skills.exploration} />
				<SkillBranchColumn branch="expedition" skills={hero.skills.expedition} />
			</div>
			{hero.skills.talent && (
				<SkillBranchColumn branch="talent" skills={[hero.skills.talent]} />
			)}
		</RecordSection>
	);
}

function SkillBranchColumn({ branch, skills }: { branch: SkillBranch; skills: HeroSkill[] }) {
	const t = useTranslations("wikiHeroes.skills");

	return (
		<div className="flex flex-col gap-4">
			<h3 className="text-muted font-mono text-xs tracking-[0.06em] uppercase">
				{t(`branch.${branch}`)}
			</h3>
			{skills.map((skill) => (
				<SkillCard key={skill.name} skill={skill} />
			))}
		</div>
	);
}

function SkillCard({ skill }: { skill: HeroSkill }) {
	const t = useTranslations("wikiHeroes.skills");

	const columns: RecordColumn<SkillLevel>[] = [
		{
			id: "level",
			header: t("levels.columns.level"),
			heading: true,
			cell: (row) => <span className="font-mono">{formatNumber(row.level)}</span>,
		},
		{
			id: "star",
			header: t("levels.columns.star"),
			cell: (row) => <span className="font-mono">{formatNumber(row.starRequired)}</span>,
		},
		{
			id: "manuals",
			header: t("levels.columns.manuals"),
			cell: (row) => <span className="font-mono">{formatNumber(row.manualsRequired)}</span>,
		},
		{
			id: "power",
			header: t("levels.columns.power"),
			cell: (row) => <KnownNumber value={row.powerGain} />,
		},
		{
			id: "effects",
			header: t("levels.columns.effects"),
			cell: (row) => (
				<span className="flex flex-col gap-0.5">
					{row.effects.map((effect) => (
						<span key={effect.name}>
							{t(`levels.effect.${effect.unit}`, {
								name: effect.name,
								amount: formatDecimal(effect.amount),
							})}
						</span>
					))}
				</span>
			),
		},
	];

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-start gap-3">
				<ItemIcon src={skill.img} size={40} />
				<div className="flex min-w-0 flex-col">
					<h4 className="font-semibold">{skill.name}</h4>
					<p className="text-muted">{skill.description}</p>
				</div>
			</div>
			<RecordTable
				columns={columns}
				rows={skill.levels}
				rowKey={(row) => String(row.level)}
			/>
		</div>
	);
}

function HeroShards({ hero }: { hero: Hero }) {
	const t = useTranslations("wikiHeroes.shards");
	const columns: RecordColumn<Hero["shardCosts"][number]>[] = [
		{
			id: "star",
			header: t("columns.star"),
			heading: true,
			cell: (tier) => (
				<span className="font-semibold">
					{t("star", { star: formatNumber(tier.star) })}
				</span>
			),
		},
		{
			id: "tiers",
			header: t("columns.tiers"),
			cell: (tier) => <span className="font-mono">{joinNumbers(tier.tierCosts)}</span>,
		},
		{
			id: "total",
			header: t("columns.total"),
			cell: (tier) => <span className="font-mono">{formatNumber(tier.total)}</span>,
		},
		{
			id: "power",
			header: t("columns.power"),
			cell: (tier) => (
				<span className="font-mono">
					<KnownNumber value={tier.power} />
				</span>
			),
		},
	];

	return (
		<RecordSection title={t("title")}>
			<RecordTable
				columns={columns}
				rows={hero.shardCosts}
				rowKey={(tier) => String(tier.star)}
			/>
		</RecordSection>
	);
}

function HeroWeapon({ hero }: { hero: Hero }) {
	const t = useTranslations("wikiHeroes.weapon");
	const weapon = hero.exclusiveWeapon;

	if (!weapon) return null;

	const widgetsOf = (level: number) =>
		widgetLevels.find((widget) => widget.level === level)?.widgets;
	const columns: RecordColumn<(typeof weapon.levels)[number]>[] = [
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
			id: "power",
			header: t("columns.power"),
			cell: (row) => (
				<span className="font-mono">
					<KnownNumber value={row.power} />
				</span>
			),
		},
		{
			id: "widgets",
			header: t("columns.widgets"),
			cell: (row) => {
				const widgets = widgetsOf(row.level);
				return widgets === undefined ? (
					<UnknownValue />
				) : (
					<span className="font-mono">{formatNumber(widgets)}</span>
				);
			},
		},
	];

	return (
		<RecordSection title={t("title")} meta={weapon.name}>
			<Card className="flex flex-col gap-4 p-4">
				<div className="flex items-center gap-3">
					<ItemIcon src={weapon.img} size={48} />
					<h3 className="text-lg font-semibold">{weapon.name}</h3>
				</div>
				<RecordTiles>
					<RecordTile value={<KnownNumber value={weapon.power} />} label={t("power")} />
					<RecordTile
						value={[
							weapon.stats.exploration.attack,
							weapon.stats.exploration.defense,
							weapon.stats.exploration.health,
						]
							.map(formatNumber)
							.join(" / ")}
						label={t("exploration")}
					/>
					<RecordTile
						value={[weapon.stats.expedition.lethality, weapon.stats.expedition.health]
							.map((value) => formatDecimal(value))
							.join(" / ")}
						label={t("expedition")}
					/>
				</RecordTiles>
				<ul className="flex flex-col gap-3">
					{weapon.skills.map((skill) => (
						<li key={skill.name} className="flex items-start gap-3">
							<ItemIcon src={skill.img} size={32} />
							<p>
								<span className="font-semibold">{skill.name}</span>
								{skill.unlockLevel !== undefined && (
									<span className="text-muted font-mono text-xs">
										{" "}
										{t("unlocksAt", { level: formatNumber(skill.unlockLevel) })}
									</span>
								)}
								<br />
								{skill.description}
							</p>
						</li>
					))}
				</ul>
			</Card>
			<h3 className="font-semibold">{t("levelsTitle")}</h3>
			<RecordTable
				columns={columns}
				rows={weapon.levels}
				rowKey={(row) => String(row.level)}
			/>
		</RecordSection>
	);
}

function HeroLevels({ hero }: { hero: Hero }) {
	const t = useTranslations("wikiHeroes.levels");

	const columns: RecordColumn<Hero["levels"][number]>[] = [
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
			id: "furnace",
			header: t("columns.furnace"),
			cell: (row) => t("furnace", { level: formatNumber(row.furnaceLevelRequired) }),
		},
		{
			id: "xp",
			header: t("columns.xp"),
			cell: (row) => <span className="font-mono">{formatNumber(row.xpRequired)}</span>,
		},
		{
			id: "power",
			header: t("columns.power"),
			cell: (row) => (
				<span className="font-mono">
					<KnownNumber value={row.power} />
				</span>
			),
		},
	];

	return (
		<RecordSection title={t("title")}>
			<RecordTable columns={columns} rows={hero.levels} rowKey={(row) => String(row.level)} />
		</RecordSection>
	);
}
