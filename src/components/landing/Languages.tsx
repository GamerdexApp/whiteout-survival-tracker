import { languageName } from "@/i18n/languageName";
import { directionOf, SUPPORTED_LOCALES } from "@/i18n/locales";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { landingCounts } from "@/data/game/landing";
import { LandingSection } from "./LandingSection";

export function Languages() {
	const t = useTranslations("landing.languages");

	return (
		<LandingSection
			id="languages"
			label={t("label")}
			title={t("title", { amount: formatNumber(landingCounts.languages) })}
		>
			<p className="text-muted max-w-2xl">{t("description")}</p>
			<ul aria-label={t("listLabel")} className="flex flex-wrap gap-2">
				{SUPPORTED_LOCALES.map((code) => (
					<li
						key={code}
						lang={code}
						dir={directionOf(code)}
						className="border-line bg-surface text-ink rounded-full border-[1.5px] px-3 py-1.5"
					>
						{languageName(code)}
					</li>
				))}
			</ul>
		</LandingSection>
	);
}
