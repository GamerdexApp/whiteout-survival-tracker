"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { relationships } from "@/data/game/experts";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { RecordSection } from "../records/RecordParts";

export function ExpertRelationships() {
	const t = useTranslations("wikiExperts.relationships");

	return (
		<RecordSection title={t("title")} meta={formatNumber(relationships.length)}>
			<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				{relationships.map((stage) => (
					<li key={stage.id}>
						<Card className="flex items-center gap-2 px-3 py-2">
							<ItemIcon src={stage.img} size={32} />
							<span className="flex min-w-0 flex-col">
								<span className="font-semibold">{stage.name}</span>
								<span className="text-muted text-xs">
									{t("fromLevel", { level: formatNumber(stage.level) })}
								</span>
							</span>
						</Card>
					</li>
				))}
			</ul>
		</RecordSection>
	);
}
