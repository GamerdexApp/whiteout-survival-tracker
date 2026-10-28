import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { glowstoneBonusPercentAt } from "@/service/labyrinth";
import { JUSTUS_GLOWSTONE_SKILL, JUSTUS_NAME } from "@/data/game/labyrinth";
import { ButtonLink } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";

export function JustusCard({ level }: { level: number }) {
	const t = useTranslations("labyrinth.justus");

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex flex-col gap-1">
				<h2 className="font-semibold">
					{t("title", { expert: JUSTUS_NAME, skill: JUSTUS_GLOWSTONE_SKILL.name })}
				</h2>
				<p className="text-muted">{t("help")}</p>
			</div>
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				<span className="font-mono font-semibold">
					{level === 0
						? t("none")
						: t("level", {
								level: formatNumber(level),
								percent: formatNumber(glowstoneBonusPercentAt(level)),
							})}
				</span>
				<span className="border-line text-muted shrink-0 rounded-full border-[1.5px] px-2 py-0.5 font-mono text-[11px] whitespace-nowrap">
					{t("readOnly")}
				</span>
			</div>
			<ButtonLink variant="link" href="/experts" className="self-start px-0">
				{t("openExperts")}
			</ButtonLink>
		</Card>
	);
}
