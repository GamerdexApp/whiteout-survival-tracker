"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { bannerLevelOf, withBannerLevel } from "@/service/alliance";
import { updateChiefById } from "@/service/chiefs";
import { describeChief } from "@/service/chiefs";
import { PageHeader } from "@/comps/layout/PageHeader";
import { BannerCard } from "./BannerCard";
import { BannerTable } from "./BannerTable";
import { StructuresCard } from "./StructuresCard";

export function AllianceView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("alliance");
	const { updateData } = usePlaythrough();
	const { ui } = useUiSettings();

	const setBannerLevel = (level: number) => {
		updateData((data) =>
			updateChiefById(data, chief.id, (current) => withBannerLevel(current, level))
		);
	};

	return (
		<>
			<PageHeader
				title={t("page.title")}
				subline={t("view.subline", {
					chief: chief.name,
					details: describeChief(chief, ui.furnaceFullLabels),
					level: formatNumber(bannerLevelOf(chief)),
				})}
			/>
			<div className="grid items-start gap-4 lg:grid-cols-2">
				<BannerCard chief={chief} onLevelChange={setBannerLevel} />
				<StructuresCard chief={chief} />
			</div>
			<BannerTable chief={chief} />
		</>
	);
}
