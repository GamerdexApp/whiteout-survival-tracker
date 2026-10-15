import { useTranslations } from "next-intl";
import { formatDecimal } from "@/lib/format";
import type { SetBonusView } from "@/service/chiefGear";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";

export function SetBonusCard({ bonuses }: { bonuses: SetBonusView[] }) {
	const t = useTranslations("chiefGear");
	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h3 className="font-semibold">{t("setBonus.title")}</h3>
				<span className="text-muted font-mono text-xs">{t("shared.package")}</span>
			</div>
			<ul className="grid gap-3 sm:grid-cols-2">
				{bonuses.map((bonus) => {
					const active = bonus.percent > 0;
					return (
						<li
							key={bonus.pieces}
							className={`flex flex-col gap-1 rounded-md border-[1.5px] p-3 ${active ? "border-primary bg-tint" : "border-line border-dashed"}`}
						>
							<span className="flex items-center justify-between gap-2">
								<span className="font-medium">
									{t("setBonus.pieceSet", { pieces: bonus.pieces })}
								</span>
								<Badge tone={active ? "kept" : "locked"}>
									{active ? t("setBonus.active") : t("setBonus.notActive")}
								</Badge>
							</span>
							{active ? (
								<>
									<span className="font-mono text-lg">
										{t("setBonus.value", {
											stat: bonus.stat,
											percent: formatDecimal(bonus.percent),
										})}
									</span>
									<span className="text-muted text-xs">
										{t("setBonus.appliesTo", {
											tierName: bonus.tierName ?? "",
										})}
									</span>
								</>
							) : (
								<span className="text-muted">
									{t("setBonus.needs", {
										pieces: bonus.pieces,
										stat: bonus.stat,
									})}
								</span>
							)}
						</li>
					);
				})}
			</ul>
		</Card>
	);
}
