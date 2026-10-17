import { useTranslations } from "next-intl";
import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";
import { Card } from "@/comps/ui/Card";
import { LandingSection } from "./LandingSection";

const itemIds = ["browser", "file", "chiefs", "backup"] as const;

export function Privacy() {
	const t = useTranslations("landing.privacy");

	return (
		<LandingSection id="privacy" label={t("label")} title={t("title")}>
			<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{itemIds.map((id) => (
					<li key={id}>
						<Card className="flex h-full flex-col gap-2 p-4">
							<h3 className="text-ink font-semibold">{t(`items.${id}.title`)}</h3>
							<p className="text-muted">{t(`items.${id}.description`)}</p>
						</Card>
					</li>
				))}
			</ul>
			<Link
				href="/settings?tab=data"
				className="text-link flex min-h-11 w-fit items-center gap-1.5 font-medium hover:underline lg:min-h-9"
			>
				{t("backupLink")}
				<LuArrowRight className="rtl:rotate-180" size={16} aria-hidden="true" />
			</Link>
		</LandingSection>
	);
}
