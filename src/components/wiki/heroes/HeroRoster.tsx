"use client";

import type { Hero } from "whiteout-survival-data";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import { matchesSearch } from "@/service/wikiRows";
import { allHeroes, heroRarities } from "@/data/game/heroes";
import { heroClassIds, heroSubClasses } from "@/data/game/wikiHeroes";
import { Badge } from "@/comps/ui/Badge";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { KnownNumber, RecordFilters, RecordLink, RecordSection } from "../records/RecordParts";
import { RecordTable } from "../records/RecordTable";
import type { RecordColumn } from "../records/RecordTable";

const ALL = "all";
const generations = [...new Set(allHeroes.map((hero) => hero.generation))];

const rarityTone = { Legendary: "changed", Epic: "added", Rare: "kept" } as const;

export function HeroRoster() {
	const t = useTranslations("wikiHeroes.roster");
	const [search, setSearch] = useState("");
	const [generation, setGeneration] = useState(ALL);
	const [rarity, setRarity] = useState(ALL);
	const [heroClass, setHeroClass] = useState(ALL);
	const [subClass, setSubClass] = useState(ALL);

	const matching = allHeroes.filter(
		(hero) =>
			matchesSearch(hero.name, search) &&
			(generation === ALL || hero.generation === Number(generation)) &&
			(rarity === ALL || hero.rarity === rarity) &&
			(heroClass === ALL || hero.class === heroClass) &&
			(subClass === ALL || hero.subClass === subClass)
	);

	const columns: RecordColumn<Hero>[] = [
		{
			id: "hero",
			header: t("columns.hero"),
			heading: true,
			cell: (hero) => (
				<RecordLink page="heroes" recordId={hero.id}>
					<ItemIcon src={hero.img} size={32} />
					{hero.name}
				</RecordLink>
			),
		},
		{
			id: "generation",
			header: t("columns.generation"),
			cell: (hero) => <span className="font-mono">{hero.generation}</span>,
		},
		{
			id: "rarity",
			header: t("columns.rarity"),
			cell: (hero) => <Badge tone={rarityTone[hero.rarity]}>{hero.rarity}</Badge>,
		},
		{ id: "class", header: t("columns.class"), cell: (hero) => hero.class },
		{ id: "subClass", header: t("columns.subClass"), cell: (hero) => hero.subClass },
		{
			id: "power",
			header: t("columns.power"),
			cell: (hero) => <KnownNumber value={hero.shardCosts.at(-1)?.power} />,
		},
		{
			id: "weapon",
			header: t("columns.weapon"),
			cell: (hero) => hero.exclusiveWeapon?.name ?? t("none"),
		},
	];

	return (
		<RecordSection
			title={t("title")}
			meta={t("count", {
				shown: formatNumber(matching.length),
				total: formatNumber(allHeroes.length),
			})}
		>
			<RecordFilters>
				<Field label={t("search")}>
					<Input
						type="search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder={t("searchPlaceholder", {
							count: formatNumber(allHeroes.length),
						})}
						leadingIcon={<LuSearch size={16} />}
					/>
				</Field>
				<Field label={t("generation")}>
					<Select
						value={generation}
						onChange={(event) => setGeneration(event.target.value)}
					>
						<option value={ALL}>{t("all")}</option>
						{generations.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</Select>
				</Field>
				<Field label={t("rarity")}>
					<Select value={rarity} onChange={(event) => setRarity(event.target.value)}>
						<option value={ALL}>{t("all")}</option>
						{heroRarities.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</Select>
				</Field>
				<Field label={t("class")}>
					<Select
						value={heroClass}
						onChange={(event) => setHeroClass(event.target.value)}
					>
						<option value={ALL}>{t("all")}</option>
						{heroClassIds.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</Select>
				</Field>
				<Field label={t("subClass")}>
					<Select value={subClass} onChange={(event) => setSubClass(event.target.value)}>
						<option value={ALL}>{t("all")}</option>
						{heroSubClasses.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</Select>
				</Field>
			</RecordFilters>
			{matching.length === 0 ? (
				<p className="text-muted">{t("empty")}</p>
			) : (
				<RecordTable columns={columns} rows={matching} rowKey={(hero) => hero.id} />
			)}
		</RecordSection>
	);
}
