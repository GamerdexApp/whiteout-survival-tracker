"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { CoreEventId, Playthrough } from "@/types/app";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { describeChief } from "@/service/chiefs";
import { shownEventsOf } from "@/service/coreEvents";
import { endedEventsOf } from "@/service/historyEvents";
import { PageHeader } from "@/comps/layout/PageHeader";
import { ButtonLink } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Tabs } from "@/comps/ui/Tabs";
import { HistoryList } from "./HistoryList";

type EventFilter = CoreEventId | "all";

export function HistoryView({ chief }: { chief: Playthrough }) {
	const t = useTranslations("history");
	const { ui } = useUiSettings();
	const [filter, setFilter] = useState<EventFilter>("all");
	const shown = shownEventsOf(chief);
	const activeFilter = filter === "all" || shown.includes(filter) ? filter : "all";

	const everyRow = useMemo(() => endedEventsOf(chief, "all"), [chief]);
	const rows = useMemo(() => endedEventsOf(chief, activeFilter), [chief, activeFilter]);

	if (everyRow.length === 0) {
		return (
			<>
				<PageHeader
					title={t("page.title")}
					subline={describeChief(chief, ui.furnaceFullLabels)}
				/>
				<EmptyState
					title={t("empty.title")}
					description={t("empty.description")}
					actions={
						<ButtonLink href="/core-events" variant="primary">
							{t("empty.action")}
						</ButtonLink>
					}
				/>
			</>
		);
	}

	const tabs = [
		{ id: "all" as EventFilter, label: t("tabs.all") },
		...shown.map((id) => ({ id: id as EventFilter, label: t(`events.${id}`) })),
	];

	return (
		<>
			<PageHeader
				title={t("page.title")}
				subline={describeChief(chief, ui.furnaceFullLabels)}
			/>
			<Tabs label={t("tabs.label")} tabs={tabs} activeId={activeFilter} onChange={setFilter}>
				<p className="text-muted">{t("list.intro")}</p>
				{rows.length === 0 ? (
					<EmptyState title={t("empty.title")} description={t("list.none")} />
				) : (
					<HistoryList rows={rows} />
				)}
			</Tabs>
		</>
	);
}
