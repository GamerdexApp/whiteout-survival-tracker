"use client";

import { useTranslations } from "next-intl";
import { ChiefGate } from "@/comps/layout/ChiefGate";
import { TundraAlbumView } from "@/comps/tundra-album/TundraAlbumView";

export default function TundraAlbumPage() {
	const t = useTranslations("tundraAlbum.page");

	return <ChiefGate title={t("title")}>{(chief) => <TundraAlbumView chief={chief} />}</ChiefGate>;
}
