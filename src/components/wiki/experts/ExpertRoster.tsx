"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import { matchesSearch } from "@/service/wikiRows";
import { allExperts, expertGenerations, unreleasedExpertList } from "@/data/game/experts";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import { Select } from "@/comps/ui/Select";
import { RecordFilters, RecordSection } from "../records/RecordParts";
import { UnknownValue } from "../UnknownValue";

const ALL = "all";

export function ExpertRoster() {
	const t = useTranslations("wikiExperts.roster");
	const [search, setSearch] = useState("");
	const [generation, setGeneration] = useState(ALL);

	const matching = allExperts.filter(
		(expert) =>
			(matchesSearch(expert.name, search) ||
				matchesSearch(expert.title, search) ||
				matchesSearch(expert.specialty, search)) &&
			(generation === ALL || expert.generation === Number(generation))
	);

	const unreleased = unreleasedExpertList.filter(
		(expert) => generation === ALL && matchesSearch(expert.name, search)
	);

	return (
		<RecordSection
			title={t("title")}
			meta={t("count", {
				shown: formatNumber(matching.length),
				total: formatNumber(allExperts.length),
			})}
		>
			<RecordFilters>
				<Field label={t("search")}>
					<Input
						type="search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder={t("searchPlaceholder", {
							count: formatNumber(allExperts.length),
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
						{expertGenerations.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</Select>
				</Field>
			</RecordFilters>
			{matching.length === 0 && unreleased.length === 0 ? (
				<p className="text-muted">{t("empty")}</p>
			) : (
				<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{matching.map((expert) => (
						<li key={expert.id}>
							<Link
								href={`/wiki/experts/${encodeURIComponent(expert.id)}`}
								className="border-line bg-surface hover:border-primary flex h-full min-h-11 w-full items-stretch overflow-hidden rounded-md border-[1.5px] text-left"
							>
								{expert.img ? (
									<img
										src={expert.img}
										alt=""
										className="w-28 shrink-0 self-stretch object-cover"
									/>
								) : (
									<span aria-hidden="true" className="bg-track w-28 shrink-0" />
								)}
								<span className="flex min-w-0 flex-col p-3">
									<span className="font-semibold">{expert.name}</span>
									<span className="text-muted">{expert.title}</span>
									<span>{expert.specialty}</span>
									<span className="text-muted">
										{t("generationValue", {
											generation: formatNumber(expert.generation),
										})}
									</span>
									<span className="text-muted">
										{expert.unlockRequirement ? (
											t("unlock", {
												days: formatNumber(
													expert.unlockRequirement.daysRequired
												),
											})
										) : (
											<>
												{t("unlockUnknown")} <UnknownValue />
											</>
										)}
									</span>
								</span>
							</Link>
						</li>
					))}
					{unreleased.map((expert) => (
						<li key={expert.id}>
							<div
								aria-disabled="true"
								className="border-line bg-surface flex h-full min-h-11 w-full cursor-not-allowed items-stretch overflow-hidden rounded-md border-[1.5px] border-dashed text-left opacity-70"
							>
								{expert.img ? (
									<img
										src={expert.img}
										alt=""
										className="w-28 shrink-0 self-stretch object-cover grayscale"
									/>
								) : (
									<span aria-hidden="true" className="bg-track w-28 shrink-0" />
								)}
								<span className="flex min-w-0 flex-col p-3">
									<span className="font-semibold">{expert.name}</span>
									<span className="text-muted">{t("unreleased")}</span>
									<span className="text-muted">
										{t("unlock", {
											days: formatNumber(
												expert.unlockRequirement.daysRequired
											),
										})}
									</span>
								</span>
							</div>
						</li>
					))}
				</ul>
			)}
		</RecordSection>
	);
}
