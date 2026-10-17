import { useTranslations } from "next-intl";
import { Card } from "@/comps/ui/Card";
import { LandingSection } from "./LandingSection";

const stepIds = ["create", "levels", "plan", "events"] as const;

export function HowItWorks() {
	const t = useTranslations("landing.how");

	return (
		<LandingSection id="how" label={t("label")} title={t("title")}>
			<ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{stepIds.map((id, index) => (
					<li key={id}>
						<Card className="flex h-full flex-col gap-2 p-4">
							<span
								aria-hidden="true"
								className="bg-tint text-primary flex size-7 items-center justify-center rounded-full font-mono text-sm"
							>
								{index + 1}
							</span>
							<h3 className="text-ink font-semibold">{t(`steps.${id}.title`)}</h3>
							<p className="text-muted">{t(`steps.${id}.description`)}</p>
						</Card>
					</li>
				))}
			</ol>
		</LandingSection>
	);
}
