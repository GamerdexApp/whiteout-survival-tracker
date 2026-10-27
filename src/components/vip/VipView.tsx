"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { describeChief, updateChiefById } from "@/service/chiefs";
import {
	totalXpOf,
	vipLevelOf,
	vipSignInOf,
	withVipLevel,
	withVipSignIn,
	withVipStreakDay,
	withVipXp,
} from "@/service/vip";
import { PageHeader } from "@/comps/layout/PageHeader";
import { useToast } from "@/comps/ui/Toast";
import { NextLevelCard, PerksCard } from "./BonusCards";
import { VipInputCard } from "./VipInputCard";
import { VipSignInCard } from "./VipSignInCard";
import { VipTable } from "./VipTable";

export function VipView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("vip");
	const { updateData } = usePlaythrough();
	const showToast = useToast();
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

	const addSignIn = () => {
		const before = chief;
		const signIn = vipSignInOf(chief, Date.now());
		const saved = updateData((data) =>
			updateChiefById(data, chief.id, (current) => withVipSignIn(current, new Date()))
		);
		if (saved === null) return;
		showToast({
			variant: "success",
			title: t("signIn.toast.title"),
			message: t("signIn.toast.message", {
				points: formatNumber(signIn.points),
				streak: formatNumber(signIn.streak),
			}),
			action: {
				label: t("signIn.toast.undo"),
				onAction: () => updateData((data) => updateChiefById(data, chief.id, () => before)),
			},
		});
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
				<div className="flex flex-col gap-4">
					<VipInputCard
						totalXp={totalXp}
						level={level}
						isEstimate={isEstimate}
						onXp={(xp) => save((current) => withVipXp(current, xp), false)}
						onLevel={(next) => save((current) => withVipLevel(current, next), true)}
					/>
					<VipSignInCard
						signIn={(now) => vipSignInOf(chief, now)}
						hasXp={totalXp !== undefined}
						onAdd={addSignIn}
						onStreakDay={(day) =>
							save(
								(current) => withVipStreakDay(current, day, new Date()),
								isEstimate
							)
						}
					/>
				</div>
				<div className="flex flex-col gap-4">
					<PerksCard level={level} />
					<NextLevelCard level={level} />
				</div>
			</div>
			<VipTable chief={chief} />
		</>
	);
}
