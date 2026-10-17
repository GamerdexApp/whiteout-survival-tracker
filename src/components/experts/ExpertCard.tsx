"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Playthrough } from "@/types/app";
import { formatDecimal, formatNumber } from "@/lib/format";
import type { ExpertChange, ExpertView } from "@/service/experts";
import {
	affinityGoalOf,
	affinityNeededFor,
	bonusLevelFor,
	bonusNowOf,
	expertPowerOf,
	isAdvancementLevel,
	nextAdvancementOf,
	relationshipNameOf,
	skillCapOf,
	skillExpNeededFor,
	skillGateOf,
	skillGoalOf,
	statNamesOf,
	talentEffectOf,
	talentLevelOf,
} from "@/service/experts";
import { unlockText } from "@/service/unlocks";
import { MAX_AFFINITY, relationshipAt } from "@/data/game/experts";
import { findItem } from "@/data/game/items";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Switch } from "@/comps/ui/Switch";
import { ValueStepper } from "@/comps/ui/ValueStepper";
import { ExpertRow, GoalText, HeldInput } from "./ExpertRows";

interface ExpertCardProps {
	view: ExpertView;
	chief: Playthrough;
	onChange: (change: ExpertChange) => void;
}

export function useStatNames() {
	const t = useTranslations("experts.common");
	return (names: string[]) =>
		names.length < 2
			? (names[0] ?? "")
			: t("and", { first: names.slice(0, -1).join(", "), last: names[names.length - 1] });
}

export function ExpertCard({ view, chief, onChange }: ExpertCardProps) {
	const t = useTranslations("experts");
	const joinNames = useStatNames();
	const { expert, recruited, locked, lockDay } = view;
	const expertId = expert.id;
	const power = expertPowerOf(view);
	const stats = joinNames(statNamesOf(expert));

	return (
		<li className="mb-3 break-inside-avoid">
			<Card dimmed={!recruited} className="flex flex-col gap-3 p-3" data-locked={locked}>
				<div className="flex items-center gap-3">
					<ItemIcon
						src={expert.img}
						size={44}
						className={recruited ? "" : "opacity-60"}
					/>
					<div className="flex min-w-0 flex-1 flex-col">
						<h3 className="truncate font-semibold">{expert.name}</h3>
						<span className="text-muted font-mono text-xs">
							{t("card.summary", {
								title: expert.title,
								specialty: expert.specialty,
								generation: t("common.generation", {
									generation: formatNumber(expert.generation),
								}),
							})}
						</span>
					</div>
					<span className="flex items-center gap-2">
						<span className="text-muted text-xs">{t("card.recruited")}</span>
						<Switch
							label={t("card.recruitedLabel", { expert: expert.name })}
							checked={recruited}
							disabled={locked}
							onChange={(next) =>
								onChange({ kind: "recruited", expertId, recruited: next })
							}
						/>
					</span>
				</div>

				{lockDay !== null && <p className="font-medium">{unlockText(chief, lockDay)}</p>}

				{view.sigilItemId && (
					<div className="flex flex-col">
						<ExpertRow label={t("card.sigilsOwned")}>
							<ItemIcon src={findItem(view.sigilItemId)?.img} size={24} />
							<HeldInput
								label={t("card.sigilsOwnedLabel", { expert: expert.name })}
								value={view.sigils}
								disabled={locked}
								onChange={(count) => onChange({ kind: "sigils", expertId, count })}
							/>
						</ExpertRow>
						<span className="text-muted text-xs">{t("card.sigilsHint")}</span>
					</div>
				)}

				{recruited ? (
					<RecruitedBody view={view} onChange={onChange} stats={stats} />
				) : (
					<div className="flex flex-col gap-1">
						{!locked && <p className="text-muted">{t("card.notRecruitedHint")}</p>}
						<p className="text-muted font-mono text-xs">
							{t("card.recruitmentCost", { cost: t("common.unknown") })}
						</p>
						<p className="text-muted font-mono text-xs">
							{t("card.maxPower", { max: formatNumber(power.max) })} ·{" "}
							{t("card.buffs", { stats })}
						</p>
					</div>
				)}
			</Card>
		</li>
	);
}

function RecruitedBody({
	view,
	onChange,
	stats,
}: {
	view: ExpertView;
	onChange: (change: ExpertChange) => void;
	stats: string;
}) {
	const t = useTranslations("experts");
	const { expert } = view;
	const expertId = expert.id;
	const level = view.affinity;
	const tens = isAdvancementLevel(level);
	const relationship = relationshipAt(bonusLevelFor(level, view.advanced));
	const needed = affinityNeededFor(expert, level);
	const bonus = bonusNowOf(view);
	const next = nextAdvancementOf(view);
	const power = expertPowerOf(view);
	const goal = affinityGoalOf(view);
	const advancedText = view.advanced ? t("card.advanced") : t("card.notAdvanced");
	const bonusReason = !tens
		? t("card.bonusOwnLevel", { level: formatNumber(level) })
		: view.advanced
			? t("card.bonusAdvanced", { level: formatNumber(level) })
			: t("card.bonusNotAdvanced", {
					level: formatNumber(level),
					counted: formatNumber(bonus.countedLevel),
				});

	return (
		<>
			<div className="flex flex-col gap-2">
				<ExpertRow label={t("card.affinityLevel")}>
					<ValueStepper
						label={t("card.affinityLabel", { expert: expert.name })}
						value={level}
						min={1}
						max={MAX_AFFINITY}
						display={t("card.affinityDisplay", {
							level: formatNumber(level),
							max: formatNumber(MAX_AFFINITY),
						})}
						onChange={(affinity) => onChange({ kind: "affinity", expertId, affinity })}
					/>
					<GoalText goal={goal} />
					{tens ? (
						<button
							type="button"
							aria-pressed={view.advanced}
							aria-label={t("card.advancedLabel", {
								expert: expert.name,
								level: formatNumber(level),
							})}
							onClick={() =>
								onChange({ kind: "advanced", expertId, advanced: !view.advanced })
							}
							className={`inline-flex min-h-11 items-center rounded-full border-[1.5px] px-2 font-mono text-[11px] tracking-[0.06em] uppercase lg:min-h-9 ${
								view.advanced ? "text-kept" : "text-muted"
							}`}
						>
							{advancedText}
						</button>
					) : (
						<Badge tone={view.advanced ? "kept" : "locked"}>{advancedText}</Badge>
					)}
				</ExpertRow>
				<ProgressBar
					value={level / MAX_AFFINITY}
					label={t("card.affinityProgress", { expert: expert.name })}
				/>
			</div>

			<div className="flex items-center gap-3">
				<ItemIcon src={relationship.img} size={36} />
				<div className="flex flex-col">
					<SectionLabel className="text-muted">{t("card.relationship")}</SectionLabel>
					<span className="font-semibold">{relationshipNameOf(view)}</span>
				</div>
			</div>

			{needed > 0 && (
				<ExpertRow label={t("card.affinityAvailable")}>
					<HeldInput
						label={t("card.affinityAvailableLabel", { expert: expert.name })}
						value={view.affinityAvailable}
						onChange={(points) =>
							onChange({ kind: "affinityAvailable", expertId, points })
						}
					/>
					<span className="text-muted font-mono text-xs">
						{t("card.affinityOf", {
							need: formatNumber(needed),
							level: formatNumber(level + 1),
						})}
					</span>
					{view.affinityAvailable >= needed && (
						<span className="text-kept font-mono text-xs">
							{t("card.affinityEnough", { level: formatNumber(level + 1) })}
						</span>
					)}
				</ExpertRow>
			)}

			<div className="border-line bg-tint flex flex-col gap-1 rounded-md border-[1.5px] p-3">
				<SectionLabel className="text-muted">{t("card.bonusTitle")}</SectionLabel>
				<span className="font-mono font-semibold">
					{t("card.bonusNow", { amount: formatDecimal(bonus.percent), stats })}
				</span>
				<span className="text-xs">{bonusReason}</span>
				<span className="text-xs">
					{t("card.bonusAtMax", { amount: formatDecimal(bonus.atMax) })} {t("card.feeds")}{" "}
					<Link href="/bonuses" className="text-link underline">
						{t("card.bonuses")}
					</Link>
					.
				</span>
			</div>
			<p className="text-muted font-mono text-xs">
				{next
					? t("card.nextAdvancement", {
							level: formatNumber(next.level),
							sigils: formatNumber(next.sigils),
						})
					: t("card.allAdvanced")}
			</p>

			<div className="flex flex-col">
				<SectionLabel className="text-muted pb-1">{t("card.skills")}</SectionLabel>
				{expert.skills.map((skill, index) => {
					const skillLevel = view.skillLevels[index];
					const skillCap = skillCapOf(view, index);
					const gate = skillGateOf(view, index);
					const skillNeeded = skillExpNeededFor(skill, skillLevel);
					return (
						<div
							key={skill.name}
							className="border-line flex flex-col gap-1 border-t-[1.5px] py-2 first:border-t-0"
						>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<span className="min-w-0 flex-1" title={skill.description}>
									{skill.name}
								</span>
								<span className="flex items-center gap-2">
									<GoalText goal={skillGoalOf(view, index)} />
									<ValueStepper
										label={t("card.skillLabel", {
											expert: expert.name,
											skill: skill.name,
										})}
										value={skillLevel}
										min={Math.min(1, skillCap)}
										max={skillCap}
										display={t("card.skillDisplay", {
											level: formatNumber(skillLevel),
											max: formatNumber(skill.maxLevel),
										})}
										onChange={(next) =>
											onChange({
												kind: "skill",
												expertId,
												index,
												level: next,
											})
										}
									/>
								</span>
							</div>
							{skillNeeded > 0 ? (
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-muted text-xs">
										{t("card.expAvailable")}
									</span>
									<HeldInput
										label={t("card.expAvailableLabel", {
											expert: expert.name,
											skill: skill.name,
										})}
										value={view.skillExp[index]}
										onChange={(exp) =>
											onChange({ kind: "skillExp", expertId, index, exp })
										}
									/>
									<span className="text-muted font-mono text-xs">
										{t("card.expOf", {
											need: formatNumber(skillNeeded),
											level: formatNumber(skillLevel + 1),
										})}
									</span>
									{view.skillExp[index] >= skillNeeded && (
										<span className="text-kept font-mono text-xs">
											{t("card.expEnough", {
												level: formatNumber(skillLevel + 1),
											})}
										</span>
									)}
								</div>
							) : skillLevel === 0 ? (
								<span className="text-muted font-mono text-xs">
									{t("card.skillLocked", {
										level: formatNumber(gate?.affinity ?? 0),
									})}
								</span>
							) : (
								<span className="text-muted font-mono text-xs">
									{t("card.maxLevel")}
								</span>
							)}
							{gate && skillLevel > 0 && (
								<span className="text-muted font-mono text-xs">
									{t("card.skillCapped", {
										next: formatNumber(gate.level),
										level: formatNumber(gate.affinity),
									})}
								</span>
							)}
						</div>
					);
				})}
			</div>

			<div className="border-line bg-bg flex flex-col gap-0.5 rounded-md border-[1.5px] p-3">
				<div className="flex items-center justify-between gap-2">
					<span className="font-semibold">
						{t("card.talent", { name: expert.talent.name })}
					</span>
					<span className="font-mono text-xs">
						{t("card.talentLevel", {
							level: formatNumber(talentLevelOf(view)),
							max: formatNumber(expert.talent.maxLevel),
						})}
					</span>
				</div>
				<span className="text-muted text-xs">
					{t("card.talentFollows", {
						relationship: relationshipNameOf(view),
						effect: talentEffectOf(view) ?? "",
					})}
				</span>
			</div>

			<div className="flex items-center justify-between gap-2">
				<span className="font-mono text-xs">
					{t("card.power", {
						now: formatNumber(power.now),
						max: formatNumber(power.max),
					})}
				</span>
				<Badge tone="added">{t("card.derived")}</Badge>
			</div>
		</>
	);
}
