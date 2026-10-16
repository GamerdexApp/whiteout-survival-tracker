"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatNumber } from "@/lib/format";
import { MAX_VIP_XP, progressOf } from "@/service/vip";
import { MAX_VIP_LEVEL } from "@/data/game/vip";
import { CountInput } from "@/comps/troops/CountInput";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { ValueStepper } from "@/comps/ui/ValueStepper";

type InputMode = "xp" | "level";

interface VipInputCardProps {
	totalXp: number | undefined;
	level: number | undefined;
	isEstimate: boolean;
	onXp: (totalXp: number) => void;
	onLevel: (level: number) => void;
}

export function VipInputCard({ totalXp, level, isEstimate, onXp, onLevel }: VipInputCardProps) {
	const t = useTranslations("vip");
	const [mode, setMode] = useState<InputMode>("xp");

	return (
		<Card className="flex flex-col gap-4 p-4">
			<h2 className="font-semibold">{t("input.title")}</h2>
			<div className="flex flex-col items-start gap-1.5">
				<SectionLabel className="text-muted">{t("input.enterAs")}</SectionLabel>
				<SegmentedControl
					label={t("input.enterAs")}
					value={mode}
					onChange={setMode}
					options={[
						{ id: "xp", label: t("input.modeXp") },
						{ id: "level", label: t("input.modeLevel") },
					]}
				/>
			</div>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div className="flex min-w-0 flex-col gap-1.5">
					{mode === "xp" ? (
						<>
							<SectionLabel className="text-muted">{t("input.xpLabel")}</SectionLabel>
							<span className="w-44">
								<CountInput
									label={t("input.xpLabel")}
									value={totalXp ?? null}
									emptyText={t("input.notSet")}
									max={MAX_VIP_XP}
									onCommit={onXp}
								/>
							</span>
							<span className="text-muted text-xs">
								{t("input.xpHint", { max: formatNumber(MAX_VIP_XP) })}
							</span>
						</>
					) : (
						<>
							<SectionLabel className="text-muted">
								{t("input.levelLabel")}
							</SectionLabel>
							<ValueStepper
								label={t("input.levelLabel")}
								value={level ?? 0}
								min={level === undefined ? 0 : 1}
								max={MAX_VIP_LEVEL}
								display={level === undefined ? t("input.notSet") : undefined}
								onChange={(next) => onLevel(Math.max(1, next))}
							/>
							<span className="text-muted max-w-64 text-xs">
								{t("input.levelHint")}
							</span>
						</>
					)}
				</div>
				<div className="flex flex-col gap-1">
					<SectionLabel className="text-muted">{t("input.reached")}</SectionLabel>
					{level === undefined ? (
						<span className="text-muted text-2xl font-semibold">
							{t("input.unknown")}
						</span>
					) : (
						<span className="text-2xl font-semibold">
							{t("input.levelName", { level: formatNumber(level) })}
						</span>
					)}
				</div>
			</div>
			{totalXp !== undefined && level !== undefined && (
				<Progress totalXp={totalXp} level={level} isEstimate={isEstimate} />
			)}
		</Card>
	);
}

function Progress({
	totalXp,
	level,
	isEstimate,
}: {
	totalXp: number;
	level: number;
	isEstimate: boolean;
}) {
	const t = useTranslations("vip.progress");
	const progress = progressOf(totalXp, level);

	if (progress === null)
		return (
			<div className="flex flex-col gap-1">
				<span className="font-semibold">{t("maxLevel")}</span>
				<span className="text-muted text-xs">
					{t("maxHint", { level: formatNumber(level) })}
				</span>
			</div>
		);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-baseline justify-between gap-3">
				<span>
					{t("toNext", {
						xp: formatNumber(progress.xpToNext),
						level: formatNumber(level + 1),
					})}
				</span>
				<span className="text-muted font-mono">
					{t("percent", { percent: formatNumber(Math.round(progress.fraction * 100)) })}
				</span>
			</div>
			<ProgressBar
				value={progress.fraction}
				label={t("label", { level: formatNumber(level) })}
			/>
			<span className="text-muted text-xs">
				{isEstimate
					? t("estimate", { level: formatNumber(level) })
					: t("range", {
							from: formatNumber(progress.levelStartXp),
							to: formatNumber(progress.nextLevelXp),
						})}
			</span>
		</div>
	);
}
