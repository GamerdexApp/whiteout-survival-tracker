"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { formatDecimal, formatNumber } from "@/lib/format";
import type { PetChange, PetView } from "@/service/pets";
import { activeGoalOf, REFINE_STEP, skillCooldownText, unlockRuleText } from "@/service/pets";
import { unlockText } from "@/service/unlocks";
import { PET_REFINEMENT_STATS } from "@/data/game/pets";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Switch } from "@/comps/ui/Switch";
import { PetNumberField } from "./PetNumberField";

interface PetCardProps {
	view: PetView;
	chief: Playthrough;
	ruleMet: boolean;
	onChange: (change: PetChange) => void;
}

export function PetCard({ view, chief, ruleMet, onChange }: PetCardProps) {
	const t = useTranslations("pets");
	const { pet, unlocked, locked, lockDay } = view;
	const petId = pet.id;

	return (
		<li className="mb-3 break-inside-avoid">
			<Card
				className={`flex flex-col gap-3 p-3 ${unlocked ? "" : "border-dashed"} ${locked ? "opacity-60" : ""}`}
				data-unlocked={unlocked}
				data-locked={locked}
			>
				<div className="flex items-center gap-3">
					<ItemIcon src={pet.img} size={44} className={unlocked ? "" : "opacity-60"} />
					<div className="flex min-w-0 flex-1 flex-col">
						<h3 className="font-semibold">{pet.name}</h3>
						<span className="text-muted font-mono text-xs">
							{t("card.summary", {
								rarity: t(`rarities.${pet.rarity}`),
								max: formatNumber(pet.maxLevel),
							})}
						</span>
					</div>
					<span className="flex items-center gap-2">
						<span className="text-muted text-xs">{t("card.unlocked")}</span>
						<Switch
							label={t("card.unlockedLabel", { pet: pet.name })}
							checked={unlocked}
							disabled={locked}
							onChange={(next) =>
								onChange({ kind: "unlocked", petId, unlocked: next })
							}
						/>
					</span>
				</div>

				{lockDay !== null && <p className="font-medium">{unlockText(chief, lockDay)}</p>}

				{unlocked ? (
					<UnlockedBody view={view} onChange={onChange} />
				) : (
					<div className="flex flex-col gap-3 opacity-80">
						<SkillLines view={view} showTiers />
					</div>
				)}

				<div className={`flex flex-col gap-1 ${unlocked ? "" : "opacity-80"}`}>
					{unlocked ? (
						<div className="flex items-center justify-between gap-3">
							<span className="text-muted">{t("card.unlockRule")}</span>
							<span className="text-right font-medium">{unlockRuleText(pet)}</span>
						</div>
					) : (
						<>
							<SectionLabel className="text-muted">
								{t("card.unlockRule")}
							</SectionLabel>
							<span className="font-medium">{unlockRuleText(pet)}</span>
							{ruleMet && (
								<span className="mt-1">
									<Badge tone="kept">{t("card.ruleMet")}</Badge>
								</span>
							)}
						</>
					)}
				</div>
			</Card>
		</li>
	);
}

function SkillLines({ view, showTiers = false }: { view: PetView; showTiers?: boolean }) {
	const t = useTranslations("pets.card");
	const { pet } = view;
	const tiers = pet.skill.values.length;

	return (
		<div className="flex flex-col">
			<span className="font-semibold">{pet.skill.name}</span>
			<span className="text-muted text-xs">
				{showTiers
					? t("skillTiers", { count: tiers, amount: formatNumber(tiers) })
					: skillCooldownText(pet)}
			</span>
		</div>
	);
}

function UnlockedBody({
	view,
	onChange,
}: {
	view: PetView;
	onChange: (change: PetChange) => void;
}) {
	const t = useTranslations("pets.card");
	const { pet } = view;
	const goal = activeGoalOf(view);
	const advancedHint = view.canAdvance ? undefined : t("advancedHint");

	return (
		<>
			<SkillLines view={view} />
			<div className="flex flex-col gap-1.5">
				<span className="text-muted">
					{t("level", { max: formatNumber(pet.maxLevel) })}
				</span>
				<div className="flex">
					<PetNumberField
						label={t("levelLabel", { pet: pet.name })}
						value={view.level}
						min={1}
						max={pet.maxLevel}
						step={1}
						display={formatNumber}
						onChange={(level) => onChange({ kind: "level", petId: pet.id, level })}
					/>
				</div>
				<div className="flex min-h-9 items-center justify-between gap-3">
					{goal ? (
						<span className="text-primary font-mono text-xs font-medium">
							{t("goal", { level: formatNumber(goal.level) })}
						</span>
					) : (
						<span className="text-muted font-mono text-xs">{t("noGoal")}</span>
					)}
					<label
						title={advancedHint}
						className={`flex min-h-11 items-center gap-2 lg:min-h-9 ${view.canAdvance ? "cursor-pointer" : "text-muted cursor-not-allowed"}`}
					>
						<input
							type="checkbox"
							checked={view.advanced}
							disabled={!view.canAdvance}
							onChange={(event) =>
								onChange({
									kind: "advanced",
									petId: pet.id,
									advanced: event.target.checked,
								})
							}
							className="accent-primary size-4"
						/>
						{t("advanced")}
					</label>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="flex items-baseline justify-between gap-3">
					<SectionLabel className="text-muted">{t("refinement")}</SectionLabel>
					<span className="text-muted font-mono text-xs">
						{t("refinementMax", { max: formatDecimal(pet.maxRefinementPercent) })}
					</span>
				</div>
				<div className="grid grid-cols-2 gap-x-2 gap-y-2">
					{PET_REFINEMENT_STATS.map((stat, index) => (
						<div key={stat.statKey} className="flex min-w-0 flex-col gap-1">
							<span className="text-muted truncate text-xs" title={stat.stat}>
								{stat.stat}
							</span>
							<div className="flex">
								<PetNumberField
									label={t("refineLabel", { pet: pet.name, stat: stat.stat })}
									value={view.refine[index]}
									min={0}
									max={pet.maxRefinementPercent}
									step={REFINE_STEP}
									display={formatDecimal}
									suffix={t("percentSign")}
									allowDecimals
									onChange={(value) =>
										onChange({ kind: "refine", petId: pet.id, index, value })
									}
								/>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="bg-tint flex flex-wrap justify-between gap-x-3 rounded-md px-3 py-2 font-mono text-xs">
				<span>{t("attack", { value: formatDecimal(view.attack) })}</span>
				<span>{t("defense", { value: formatDecimal(view.defense) })}</span>
				<span>
					{view.power === null
						? t("powerUnknown")
						: t("power", { value: formatNumber(view.power) })}
				</span>
			</div>
			{view.power !== null && view.refiningPower > 0 && (
				<p className="text-muted font-mono text-xs">
					{t("powerParts", {
						base: formatNumber(view.levelPower ?? 0),
						refining: formatNumber(view.refiningPower),
					})}
				</p>
			)}
		</>
	);
}
