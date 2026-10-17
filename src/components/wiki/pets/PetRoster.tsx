"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import { formatDecimal, formatNumber } from "@/lib/format";
import { matchesSearch } from "@/service/wikiRows";
import { allPets, petRarities } from "@/data/game/pets";
import { Badge } from "@/comps/ui/Badge";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Select } from "@/comps/ui/Select";
import { RecordFilters, RecordSection } from "../records/RecordParts";
import { petRarityTone } from "./petRarityTone";
import { unlockRequirementText } from "./petText";

const ALL = "all";

export function PetRoster() {
	const t = useTranslations("wikiPets");
	const [search, setSearch] = useState("");
	const [rarity, setRarity] = useState(ALL);

	const matching = allPets.filter(
		(pet) => matchesSearch(pet.name, search) && (rarity === ALL || pet.rarity === rarity)
	);

	return (
		<RecordSection
			title={t("roster.title")}
			meta={t("roster.count", {
				shown: formatNumber(matching.length),
				total: formatNumber(allPets.length),
			})}
		>
			<RecordFilters>
				<Field label={t("roster.search")}>
					<Input
						type="search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder={t("roster.searchPlaceholder", {
							count: formatNumber(allPets.length),
						})}
						leadingIcon={<LuSearch size={16} />}
					/>
				</Field>
				<Field label={t("roster.rarity")}>
					<Select value={rarity} onChange={(event) => setRarity(event.target.value)}>
						<option value={ALL}>{t("roster.all")}</option>
						{petRarities.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</Select>
				</Field>
			</RecordFilters>
			{matching.length === 0 ? (
				<p className="text-muted">{t("roster.empty")}</p>
			) : (
				<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{matching.map((pet) => (
						<li key={pet.id}>
							<Link
								href={`/wiki/pets/${encodeURIComponent(pet.id)}`}
								className="border-line bg-surface hover:border-primary flex min-h-11 w-full items-start gap-3 rounded-md border-[1.5px] p-3 text-left"
							>
								<ItemIcon src={pet.img} size={40} />
								<span className="flex min-w-0 flex-col gap-1">
									<span className="flex flex-wrap items-center gap-2">
										<span className="font-semibold">{pet.name}</span>
										<Badge tone={petRarityTone[pet.rarity]}>{pet.rarity}</Badge>
									</span>
									<span>
										{t("roster.summary", {
											level: formatNumber(pet.maxLevel),
											percent: t("roster.percentValue", {
												value: formatDecimal(pet.maxRefinementPercent),
											}),
										})}
									</span>
									<span className="text-muted">
										{t("unlock.label", {
											requirement: unlockRequirementText(pet),
										})}
									</span>
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</RecordSection>
	);
}
