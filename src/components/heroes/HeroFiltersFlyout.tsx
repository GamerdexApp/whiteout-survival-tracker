"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { HeroFilters, HeroOrder, OwnedFilter } from "@/service/heroes";
import { heroClasses, heroRarities } from "@/data/game/heroes";
import { Button } from "@/comps/ui/Button";
import { Flyout } from "@/comps/ui/Flyout";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface HeroFiltersFlyoutProps {
	open: boolean;
	filters: HeroFilters;
	generations: number[];
	shown: number;
	onChange: (filters: HeroFilters) => void;
	onReset: () => void;
	onClose: () => void;
}

const ownershipIds: OwnedFilter[] = ["all", "owned", "notOwned"];

const orderIds: HeroOrder[] = ["owned", "generation", "name", "power"];

export function HeroFiltersFlyout({
	open,
	filters,
	generations,
	shown,
	onChange,
	onReset,
	onClose,
}: HeroFiltersFlyoutProps) {
	const t = useTranslations("heroes.filtersFlyout");
	const tc = useTranslations("heroes.common");
	const allOption = { id: "all", label: t("all") };

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			description={t("description")}
			footer={
				<>
					<Button variant="link" onClick={onReset} className="mr-auto">
						{t("reset")}
					</Button>
					<Button variant="primary" onClick={onClose}>
						{t("show", {
							heroes: tc("heroCount", { count: shown, amount: formatNumber(shown) }),
						})}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("generation")}</SectionLabel>
				<RadioGroup
					label={t("generation")}
					options={[
						allOption,
						...generations.map((generation) => ({
							id: String(generation),
							label: tc("generation", { generation: formatNumber(generation) }),
						})),
					]}
					value={String(filters.generation)}
					onChange={(value) =>
						onChange({
							...filters,
							generation: value === "all" ? "all" : Number(value),
						})
					}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("rarity")}</SectionLabel>
				<RadioGroup
					label={t("rarity")}
					options={[
						allOption,
						...heroRarities.map((rarity) => ({
							id: rarity,
							label: t(`rarities.${rarity}`),
						})),
					]}
					value={filters.rarity}
					onChange={(rarity) =>
						onChange({ ...filters, rarity: rarity as HeroFilters["rarity"] })
					}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("heroClass")}</SectionLabel>
				<RadioGroup
					label={t("heroClass")}
					options={[
						allOption,
						...heroClasses.map((name) => ({ id: name, label: t(`classes.${name}`) })),
					]}
					value={filters.heroClass}
					onChange={(heroClass) =>
						onChange({ ...filters, heroClass: heroClass as HeroFilters["heroClass"] })
					}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("ownership")}</SectionLabel>
				<RadioGroup
					label={t("ownership")}
					options={ownershipIds.map((id) => ({
						id,
						label: t(`ownershipOptions.${id}`),
					}))}
					value={filters.ownership}
					onChange={(ownership) => onChange({ ...filters, ownership })}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("order")}</SectionLabel>
				<RadioGroup
					label={t("order")}
					options={orderIds.map((id) => ({ id, label: t(`orderOptions.${id}`) }))}
					value={filters.order}
					onChange={(order) => onChange({ ...filters, order })}
				/>
			</div>
			<p className="text-muted">{t("notSaved")}</p>
		</Flyout>
	);
}
