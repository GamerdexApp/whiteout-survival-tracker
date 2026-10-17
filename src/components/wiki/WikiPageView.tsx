"use client";

import type { WikiPageId } from "@/data/wiki";
import { wikiPageComponents } from "./registry";

export function WikiPageView({ id, recordId }: { id: WikiPageId; recordId?: string }) {
	const Page = wikiPageComponents[id];

	return <Page recordId={recordId} />;
}
