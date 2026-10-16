"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { MilestoneTarget } from "@/service/eventsResults";
import { Card } from "@/comps/ui/Card";

interface TargetsCardProps {
	targets: MilestoneTarget[];
	reached: string[];
	unit: string;
	onChange: (reached: string[]) => void;
}

export function TargetsCard({ targets, reached, unit, onChange }: TargetsCardProps) {
	const t = useTranslations("events.result");
	const anyUnknown = targets.some((target) => target.points === undefined);

	const toggle = (name: string, on: boolean) =>
		onChange(on ? [...reached, name] : reached.filter((item) => item !== name));

	return (
		<Card className="flex flex-col gap-2 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h3 className="font-semibold">{t("targetsTitle")}</h3>
				<span className="text-muted font-mono text-xs">
					{t("targetsCount", {
						reached: formatNumber(reached.length),
						total: formatNumber(targets.length),
					})}
				</span>
			</div>
			<ul className="divide-line divide-y-[1.5px]">
				{targets.map((target) => (
					<li key={target.name}>
						<label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
							<input
								type="checkbox"
								checked={reached.includes(target.name)}
								onChange={(event) => toggle(target.name, event.target.checked)}
								className="accent-primary mt-1 size-5 shrink-0"
							/>
							<span className="flex min-w-0 flex-1 flex-col gap-0.5">
								<span className="font-medium">{target.name}</span>
								<span className="text-muted font-mono text-xs">
									{target.points === undefined
										? t("pointsMissing", { unit })
										: t("targetPoints", {
												points: formatNumber(target.points),
												unit,
											})}
								</span>
								{target.rewardsText && (
									<span className="text-sm">{target.rewardsText}</span>
								)}
								{target.needsPurchase && (
									<span className="text-warn text-sm">{t("needsPurchase")}</span>
								)}
							</span>
						</label>
					</li>
				))}
			</ul>
			<p className="text-muted text-xs">
				{anyUnknown ? t("targetsHintUnknown") : t("targetsHint")}
			</p>
		</Card>
	);
}
