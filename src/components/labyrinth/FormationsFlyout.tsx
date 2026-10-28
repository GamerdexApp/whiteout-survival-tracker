"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { buildHeroViews } from "@/service/heroes";
import type { HeroView } from "@/service/heroes";
import {
	formationsDraftOf,
	HERO_FORMATION_COUNT,
	heroChoicesFor,
	heroPowerWithGearOf,
	isDraftValid,
	TROOP_TYPES,
} from "@/service/labyrinthFormations";
import type {
	FormationsDraft,
	HeroFormationDraft,
	HeroPowerOf,
	ZoneFormationDraft,
} from "@/service/labyrinthFormations";
import { labyrinthZones } from "@/data/game/labyrinth";
import { HeroPicker } from "@/comps/heroes/HeroPicker";
import { Card } from "@/comps/ui/Card";
import { CollapsibleSection } from "@/comps/ui/CollapsibleSection";
import { Flyout } from "@/comps/ui/Flyout";
import { PlanFooter } from "@/comps/ui/PlanFooter";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { TroopSplitFields } from "./TroopSplitFields";

interface FormationsFlyoutProps {
	open: boolean;
	chief: Playthrough;
	onClose: () => void;
	onSave: (draft: FormationsDraft) => void;
}

export function FormationsFlyout({ open, ...props }: FormationsFlyoutProps) {
	return open ? <FormationsFlyoutContent {...props} /> : null;
}

function FormationsFlyoutContent({ chief, onClose, onSave }: Omit<FormationsFlyoutProps, "open">) {
	const t = useTranslations("labyrinth.formations");
	const [draft, setDraft] = useState(() => formationsDraftOf(chief));
	const heroViews = useMemo(() => buildHeroViews(chief), [chief]);
	const powerOf = useMemo(() => heroPowerWithGearOf(chief), [chief]);

	const changeZone = (zoneId: string, zone: ZoneFormationDraft) =>
		setDraft((current) => ({ ...current, [zoneId]: zone }));

	return (
		<Flyout
			open
			onClose={onClose}
			title={t("title")}
			description={t("description")}
			footer={
				<PlanFooter
					closeLabel={t("close")}
					onClose={onClose}
					saveLabel={t("save")}
					saveDisabled={!isDraftValid(draft)}
					onSave={() => onSave(draft)}
				/>
			}
		>
			{labyrinthZones.map((zone) => {
				const zoneDraft = draft[zone.id];
				return (
					<CollapsibleSection key={zone.id} title={zone.name}>
						{zoneDraft.kind === "heroes" ? (
							<HeroFormations
								formations={zoneDraft.formations}
								heroViews={heroViews}
								powerOf={powerOf}
								onChange={(formations) =>
									changeZone(zone.id, { kind: "heroes", formations })
								}
							/>
						) : (
							<>
								<p className="text-muted">{t("troopsHint")}</p>
								<TroopSplitFields
									split={zoneDraft.troops}
									onChange={(troops) =>
										changeZone(zone.id, { kind: "troops", troops })
									}
								/>
							</>
						)}
					</CollapsibleSection>
				);
			})}
		</Flyout>
	);
}

interface HeroFormationsProps {
	formations: HeroFormationDraft[];
	heroViews: HeroView[];
	powerOf: HeroPowerOf;
	onChange: (formations: HeroFormationDraft[]) => void;
}

function HeroFormations({ formations, heroViews, powerOf, onChange }: HeroFormationsProps) {
	const t = useTranslations("labyrinth.formations");

	const change = (index: number, update: (formation: HeroFormationDraft) => HeroFormationDraft) =>
		onChange(
			formations.map((formation, position) =>
				position === index ? update(formation) : formation
			)
		);

	return (
		<>
			<p className="text-muted">{t("heroesHint")}</p>
			{formations.map((formation, index) => (
				<Card key={index} className="flex flex-col gap-3 p-4">
					<h4 className="font-semibold">
						{t("formationTitle", { number: index + 1, count: HERO_FORMATION_COUNT })}
					</h4>
					<div className="grid gap-3 sm:grid-cols-3">
						{TROOP_TYPES.map((type) => {
							const label = t("heroLabel", { type: t(`troopTypes.${type}`) });
							return (
								<div key={type} className="flex min-w-0 flex-col gap-1.5">
									<SectionLabel className="text-muted">{label}</SectionLabel>
									<HeroPicker
										label={label}
										emptyLabel={t("noHero")}
										showBadges={false}
										powerOf={powerOf}
										views={heroChoicesFor(
											heroViews,
											formations,
											index,
											type,
											powerOf
										)}
										selectedId={formation.heroes[type] ?? ""}
										onChange={(heroId) =>
											change(index, (current) => ({
												...current,
												heroes: {
													...current.heroes,
													[type]: heroId || null,
												},
											}))
										}
									/>
								</div>
							);
						})}
					</div>
					<TroopSplitFields
						split={formation.troops}
						onChange={(troops) => change(index, (current) => ({ ...current, troops }))}
					/>
				</Card>
			))}
		</>
	);
}
