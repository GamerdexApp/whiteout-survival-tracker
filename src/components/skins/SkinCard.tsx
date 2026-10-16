"use client";

import { useTranslations } from "next-intl";
import { LuTriangleAlert } from "react-icons/lu";
import type { SkinView } from "@/service/skins";
import { Card } from "@/comps/ui/Card";
import { ItemIcon } from "@/comps/ui/ItemIcon";
import { Switch } from "@/comps/ui/Switch";

interface SkinCardProps {
	view: SkinView;
	onOwned: (owned: boolean) => void;
}

function Unknown() {
	const t = useTranslations("skins.card");
	return <span className="text-muted">{t("unknown")}</span>;
}

export function SkinCard({ view, onOwned }: SkinCardProps) {
	const t = useTranslations("skins.card");
	const { skin, owned, hasDomainBonus } = view;
	const sources = skin.sources.slice(0, 2);

	return (
		<li>
			<Card className="flex flex-col gap-3 p-3" data-owned={owned}>
				<div className="flex items-start gap-3">
					<ItemIcon src={skin.img} size={44} />
					<div className="flex min-w-0 flex-1 flex-col">
						<h3 className="font-semibold">{skin.name}</h3>
						<span className="text-muted">{skin.skinType}</span>
					</div>
					<span className="flex shrink-0 items-center gap-2">
						<span className={owned ? "" : "text-muted"}>{t("owned")}</span>
						<Switch
							label={t("ownedLabel", { name: skin.name, type: skin.skinType })}
							checked={owned}
							onChange={onOwned}
						/>
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<div className="flex items-baseline gap-3">
						<span className="text-muted w-14 shrink-0">{t("bonus")}</span>
						{skin.bonus ? (
							<span className="font-mono">
								{t("bonusValue", {
									value: skin.bonus.value,
									stat: skin.bonus.stat,
								})}
							</span>
						) : (
							<Unknown />
						)}
					</div>
					<div className="flex items-baseline gap-3">
						<span className="text-muted w-14 shrink-0">{t("source")}</span>
						{sources.length > 0 ? (
							<span className="flex min-w-0 flex-col">
								{sources.map((source) => (
									<span key={source}>{source}</span>
								))}
							</span>
						) : (
							<Unknown />
						)}
					</div>
				</div>
				<p className="text-muted line-clamp-3 text-xs" title={skin.description}>
					{skin.description}
				</p>
				{hasDomainBonus && (
					<p className="text-warn flex items-start gap-2 text-xs">
						<LuTriangleAlert size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
						{t("domainWarning")}
					</p>
				)}
			</Card>
		</li>
	);
}
