"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Playthrough } from "@/types/app";
import { formatNumber } from "@/lib/format";
import { structuresOverview } from "@/service/alliance";
import { fortressCounts } from "@/service/allianceFacilities";
import { facilities } from "@/data/game/alliance";
import { Card } from "@/comps/ui/Card";

function StructureLink({
	href,
	title,
	description,
	status,
}: {
	href: string;
	title: string;
	description: string;
	status: ReactNode;
}) {
	return (
		<Link
			href={href}
			className="border-line bg-tint hover:bg-surface focus-visible:ring-primary flex items-center justify-between gap-3 rounded-md border-[1.5px] p-3 focus-visible:ring-2 focus-visible:outline-none"
		>
			<span className="flex min-w-0 flex-col">
				<span className="font-semibold">{title}</span>
				<span className="text-muted">{description}</span>
			</span>
			<span className="text-muted max-w-[45%] text-end font-mono text-xs">{status}</span>
		</Link>
	);
}

export function StructuresCard({ chief }: { chief: Playthrough }) {
	const t = useTranslations("alliance.structures");
	const overview = structuresOverview(chief);
	const counts = fortressCounts();

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="font-semibold">{t("title")}</h2>
			<StructureLink
				href="/tech"
				title={t("tech.title")}
				description={t("tech.description", { count: formatNumber(overview.techNodes) })}
				status={t("tech.status", {
					maxed: formatNumber(overview.maxed),
					progress: formatNumber(overview.inProgress),
					locked: formatNumber(overview.locked),
				})}
			/>
			<StructureLink
				href="/facilities"
				title={t("facilities.title")}
				description={t("facilities.description", {
					count: formatNumber(facilities.length),
				})}
				status={t("facilities.owned", {
					owned: formatNumber(overview.facilityLevelsOwned),
				})}
			/>
			<StructureLink
				href="/facilities"
				title={t("fortresses.title")}
				description={t("fortresses.description", {
					strongholds: formatNumber(counts.stronghold),
					fortresses: formatNumber(counts.fortress),
				})}
				status={t("fortresses.reference")}
			/>
		</Card>
	);
}
