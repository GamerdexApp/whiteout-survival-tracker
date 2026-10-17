import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { landingCounts } from "@/data/game/landing";
import { LandingSection } from "./LandingSection";

const numberIds = ["buildings", "heroes", "research", "coreEvents", "wiki"] as const;

export function Numbers() {
	const t = useTranslations("landing.numbers");

	return (
		<LandingSection id="numbers" title={t("title")} hideTitle>
			<ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-5">
				{numberIds.map((id) => (
					<li key={id} className="flex flex-col gap-1">
						<span className="text-primary font-mono text-3xl">
							{formatNumber(landingCounts[id])}
						</span>
						<span className="text-muted">{t(id)}</span>
					</li>
				))}
			</ul>
		</LandingSection>
	);
}
