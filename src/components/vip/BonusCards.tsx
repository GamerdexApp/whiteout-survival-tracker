"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { bonusChanges, bonusesOfLevel } from "@/service/vip";
import type { BonusChange } from "@/service/vip";
import { MAX_VIP_LEVEL } from "@/data/game/vip";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";

function CardHeading({ title, subtitle }: { title: string; subtitle: string }) {
	return (
		<div className="flex flex-col gap-1 p-4 pb-2">
			<h2 className="font-semibold">{title}</h2>
			<p className="text-muted text-xs">{subtitle}</p>
		</div>
	);
}

const rowClasses = "border-line flex items-center gap-3 border-t-[1.5px] px-4 py-2.5";

export function PerksCard({ level }: { level: number | undefined }) {
	const t = useTranslations("vip.perks");

	if (level === undefined)
		return (
			<Card className="p-4">
				<p className="text-muted">{t("unknown")}</p>
			</Card>
		);

	return (
		<Card className="overflow-hidden">
			<CardHeading
				title={t("title", { level: formatNumber(level) })}
				subtitle={t("subtitle")}
			/>
			<ul>
				{bonusesOfLevel(level).map((bonus) => (
					<li key={bonus.statKey} className={rowClasses}>
						<span className="flex-1">{bonus.stat}</span>
						<span className="font-mono">{bonus.value}</span>
					</li>
				))}
			</ul>
		</Card>
	);
}

function ChangeRow({ change }: { change: BonusChange }) {
	const t = useTranslations("vip.next");
	const rose = change.was !== null && change.was.amount !== change.bonus.amount;

	return (
		<li className={rowClasses}>
			<span className="flex-1">{change.bonus.stat}</span>
			{change.was === null && <Badge tone="added">{t("new")}</Badge>}
			{rose && change.was && (
				<span className="text-muted font-mono text-xs">
					{t("was", { value: change.was.value })}
				</span>
			)}
			<span className="font-mono">{change.bonus.value}</span>
		</li>
	);
}

export function NextLevelCard({ level }: { level: number | undefined }) {
	const t = useTranslations("vip.next");

	if (level === undefined)
		return (
			<Card className="p-4">
				<p className="text-muted">{t("unknown")}</p>
			</Card>
		);

	if (level >= MAX_VIP_LEVEL)
		return (
			<Card className="p-4">
				<p className="text-muted">{t("maxLevel")}</p>
			</Card>
		);

	return (
		<Card className="overflow-hidden">
			<CardHeading
				title={t("title", { level: formatNumber(level + 1) })}
				subtitle={t("subtitle", { from: formatNumber(level) })}
			/>
			<ul>
				{bonusChanges(level + 1).map((change) => (
					<ChangeRow key={change.bonus.statKey} change={change} />
				))}
			</ul>
		</Card>
	);
}
