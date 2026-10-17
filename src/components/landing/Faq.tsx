import { useTranslations } from "next-intl";
import { LuChevronDown } from "react-icons/lu";
import { Card } from "@/comps/ui/Card";
import { LandingSection } from "./LandingSection";

const questionIds = ["free", "data", "move", "chiefs", "account", "official", "wiki"] as const;

export function Faq() {
	const t = useTranslations("landing.faq");

	return (
		<LandingSection id="faq" label={t("label")} title={t("title")} tinted>
			<div className="flex max-w-3xl flex-col gap-3">
				{questionIds.map((id) => (
					<Card key={id}>
						<details className="group">
							<summary className="text-ink flex min-h-11 list-none items-center justify-between gap-3 rounded-md px-4 py-2 font-semibold [&::-webkit-details-marker]:hidden">
								{t(`items.${id}.question`)}
								<LuChevronDown
									size={16}
									aria-hidden="true"
									className="text-muted shrink-0 transition-transform group-open:rotate-180"
								/>
							</summary>
							<p className="text-muted px-4 pb-4">{t(`items.${id}.answer`)}</p>
						</details>
					</Card>
				))}
			</div>
		</LandingSection>
	);
}
