"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { HistoryEventView } from "@/comps/history/HistoryEventView";
import { ChiefGate } from "@/comps/layout/ChiefGate";

function HistoryEntry() {
	const t = useTranslations("history.page");
	const params = useSearchParams();

	return (
		<ChiefGate title={t("title")}>
			{(chief) => (
				<HistoryEventView
					chief={chief}
					event={params.get("event") ?? ""}
					entryId={params.get("entry") ?? ""}
				/>
			)}
		</ChiefGate>
	);
}

export default function HistoryEntryPage() {
	return (
		<Suspense fallback={null}>
			<HistoryEntry />
		</Suspense>
	);
}
