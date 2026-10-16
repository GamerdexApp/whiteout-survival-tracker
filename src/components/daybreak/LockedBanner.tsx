"use client";

import { useTranslations } from "next-intl";
import { formatFurnaceLevel, formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { ButtonLink } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";

interface LockedBannerProps {
	unlockLevel: string;
	currentLevel: string | undefined;
	missing: number;
}

export function LockedBanner({ unlockLevel, currentLevel, missing }: LockedBannerProps) {
	const t = useTranslations("daybreak.locked");
	const { ui } = useUiSettings();
	const level = formatFurnaceLevel(unlockLevel, ui.furnaceFullLabels);

	return (
		<Card
			highlighted
			role="status"
			className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
		>
			<div className="flex flex-col gap-1">
				<h2 className="font-semibold">{t("title", { level })}</h2>
				<p className="text-muted">
					{currentLevel
						? t("description", {
								level,
								current: formatFurnaceLevel(currentLevel, ui.furnaceFullLabels),
								missing: t("missing", {
									count: missing,
									amount: formatNumber(missing),
								}),
							})
						: t("noFurnace", { level })}
				</p>
			</div>
			<ButtonLink href="/buildings" className="shrink-0">
				{t("link")}
			</ButtonLink>
		</Card>
	);
}
