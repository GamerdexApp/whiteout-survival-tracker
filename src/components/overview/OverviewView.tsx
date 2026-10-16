"use client";

import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import { formatFurnaceLevel, formatNumber } from "@/lib/format";
import { useNow } from "@/lib/hooks/useNow";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { furnaceProgressOf } from "@/service/overview";
import { serverAgeOf } from "@/service/overviewEvents";
import { PageHeader } from "@/comps/layout/PageHeader";
import { CoreTodayCard } from "./CoreTodayCard";
import { DailiesCard } from "./DailiesCard";
import { EventsCard } from "./EventsCard";
import { LastResultCard } from "./LastResultCard";
import { OverviewTiles } from "./OverviewTiles";
import { PlannerCard } from "./PlannerCard";
import { PowerCard } from "./PowerCard";
import { ProgressCard } from "./ProgressCard";
import { QueuesCard } from "./QueuesCard";
import { ServerAgeCard } from "./ServerAgeCard";

const COLUMN = "contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4";

export function OverviewView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("overview");
	const { ui } = useUiSettings();
	const now = useNow();
	const zone = chief.eventsTimeZone ?? "utc";
	const furnace = furnaceProgressOf(chief);
	const age = serverAgeOf(chief, now);

	const subline = [
		chief.name,
		chief.stateNumber === undefined
			? null
			: t("header.state", { number: String(chief.stateNumber) }),
		furnace.level
			? t("header.furnace", {
					level: formatFurnaceLevel(furnace.level, ui.furnaceFullLabels ?? false),
				})
			: null,
		age.days === null ? null : t("header.serverAge", { days: formatNumber(age.days) }),
		t("header.derived"),
	]
		.filter(Boolean)
		.join(" · ");

	return (
		<>
			<PageHeader title={t("page.title")} subline={subline} />
			<OverviewTiles chief={chief} now={now} zone={zone} />
			<PowerCard chief={chief} />
			<div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start">
				<div className={COLUMN}>
					<EventsCard chief={chief} now={now} zone={zone} className="order-1" />
					<QueuesCard chief={chief} now={now} className="order-3" />
					<PlannerCard chief={chief} className="order-5" />
				</div>
				<div className={COLUMN}>
					<CoreTodayCard chief={chief} now={now} className="order-2" />
					<LastResultCard chief={chief} className="order-4" />
					<ServerAgeCard chief={chief} now={now} className="order-8 lg:order-7" />
					<DailiesCard chief={chief} now={now} className="order-6 lg:order-8" />
				</div>
				<ProgressCard chief={chief} className="order-7 lg:order-last lg:col-span-2" />
			</div>
		</>
	);
}
