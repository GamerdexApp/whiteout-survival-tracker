"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { describeChief, updateChiefById } from "@/service/chiefs";
import { totalXpOf, vipLevelOf, withVipLevel, withVipXp } from "@/service/vip";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Button } from "@/comps/ui/Button";
import { NextLevelCard, PerksCard } from "./BonusCards";
import { VipInputCard } from "./VipInputCard";
import { VipTable } from "./VipTable";

export function VipView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("vip");
	const { updateData } = usePlaythrough();
	const { ui } = useUiSettings();
	const [isEstimate, setIsEstimate] = useState(false);

	const totalXp = totalXpOf(chief);
	const level = vipLevelOf(chief);
	const details = describeChief(chief, ui.furnaceFullLabels);

	const save = (change: (current: Playthrough) => Playthrough, estimate: boolean) => {
		const saved = updateData((data) => updateChiefById(data, chief.id, change));
		if (saved === null) return;
		setIsEstimate(estimate);
	};

	return (
		<>
			<PageHeader
				title={t("page.title")}
				subline={
					totalXp === undefined
						? t("view.sublineUnknown", { chief: chief.name, details })
						: t("view.sublineKnown", {
								chief: chief.name,
								details,
								level: formatNumber(level ?? 1),
								xp: formatNumber(totalXp),
							})
				}
			/>
			<div className="grid items-start gap-4 lg:grid-cols-2">
				<VipInputCard
					totalXp={totalXp}
					level={level}
					isEstimate={isEstimate}
					onXp={(xp) => save((current) => withVipXp(current, xp), false)}
					onLevel={(next) => save((current) => withVipLevel(current, next), true)}
				/>
				<div className="flex flex-col gap-4">
					<PerksCard level={level} />
					<NextLevelCard level={level} />
				</div>
			</div>
			<VipTable chief={chief} />
		</>
	);
}
