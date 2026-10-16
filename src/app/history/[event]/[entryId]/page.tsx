"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { HistoryEventView } from "@/comps/history/HistoryEventView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

export default function HistoryEventPage() {
	const t = useTranslations("history.page");
	const params = useParams<{ event: string; entryId: string }>();

	return (
		<ChiefGate title={t("title")}>
			{(chief) => (
				<HistoryEventView
					chief={chief}
					event={params.event}
					entryId={decodeURIComponent(params.entryId)}
				/>
			)}
		</ChiefGate>
	);
}
