"use client";

import { useTranslations } from "next-intl";
import { findItem } from "@/data/game/items";
import { CountInput } from "@/comps/resources/CountControl";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const LIFE_ESSENCE_ITEM_ID = "life-essence";

const lifeEssenceItem = findItem(LIFE_ESSENCE_ITEM_ID);

interface LifeEssenceCardProps {
	count: number;
	onChange: (count: number) => void;
}

export function LifeEssenceCard({ count, onChange }: LifeEssenceCardProps) {
	const t = useTranslations("daybreak.lifeEssence");

	return (
		<Card className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
			<span className="flex min-w-0 items-center gap-3">
				<ItemIcon src={lifeEssenceItem?.img} size={32} />
				<span className="flex min-w-0 flex-col">
					<SectionLabel className="text-muted">{t("label")}</SectionLabel>
					<span className="text-muted text-xs">{t("note")}</span>
				</span>
			</span>
			<CountInput
				label={t("owned")}
				value={count}
				onChange={onChange}
				className="w-full sm:ms-auto sm:w-48"
			/>
		</Card>
	);
}
