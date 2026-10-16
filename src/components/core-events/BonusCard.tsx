import { useTranslations } from "next-intl";
import type { CoreEventId, Playthrough } from "@/types/app";
import { eventBonusOf } from "@/service/coreEvents";
import { ButtonLink } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Note } from "@/comps/ui/Note";

interface BonusCardProps {
	chief: Playthrough;
	event: CoreEventId;
	bonusPercent: number;
}

export function BonusCard({ chief, event, bonusPercent }: BonusCardProps) {
	const t = useTranslations("coreEvents.bonus");
	const bonus = eventBonusOf(chief, event);

	if (!bonus) return <Note>{event === "king" ? t("kingNote") : t("hallNote")}</Note>;

	return (
		<Card className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
			<div className="flex flex-col gap-1">
				<h2 className="font-semibold">
					{t("title", { expert: bonus.expertName, skill: bonus.skillName })}
				</h2>
				<p className="text-muted">{event === "svs" ? t("svsHelp") : t("showdownHelp")}</p>
			</div>
			<div className="flex shrink-0 flex-col gap-2 lg:items-end">
				<div className="flex items-center gap-2">
					<span className="font-mono font-semibold">
						{bonus.level === null
							? t("none")
							: t("levelWithPercent", { level: bonus.level, percent: bonusPercent })}
					</span>
					<span className="border-line text-muted rounded-full border-[1.5px] px-2 py-0.5 font-mono text-[11px]">
						{t("readOnly")}
					</span>
				</div>
				<ButtonLink
					variant="link"
					href="/experts"
					className="max-lg:justify-start max-lg:px-0"
				>
					{t("openExperts")}
				</ButtonLink>
			</div>
		</Card>
	);
}
