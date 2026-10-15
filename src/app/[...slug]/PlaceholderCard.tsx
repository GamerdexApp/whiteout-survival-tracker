"use client";

import { useTranslations } from "next-intl";
import type { RouteId } from "@/data/nav";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";

interface PlaceholderCardProps {
	routeId: RouteId;
	phase: number;
}

export function PlaceholderCard({ routeId, phase }: PlaceholderCardProps) {
	const t = useTranslations("shell");
	const name = t(`nav.items.${routeId}`);
	const phaseText = String(phase);

	return (
		<>
			<PageHeader title={name} />
			<Card className="flex flex-col items-start gap-3 p-6">
				<Badge tone="locked">{t("placeholder.phase", { phase: phaseText })}</Badge>
				<h2 className="text-lg font-semibold">{t("placeholder.title", { name })}</h2>
				<p className="text-muted">{t("placeholder.description", { phase: phaseText })}</p>
			</Card>
		</>
	);
}
