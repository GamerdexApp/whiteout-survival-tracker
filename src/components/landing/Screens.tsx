import { useTranslations } from "next-intl";
import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";
import { Card } from "@/comps/ui/Card";
import { LandingSection } from "./LandingSection";
import { ScreenshotFrame } from "./ScreenshotFrame";

type ScreenId = "buildings" | "coreEvents" | "calculator";

const screens: { id: ScreenId; image: string; href: string }[] = [
	{ id: "buildings", image: "buildings", href: "/buildings" },
	{ id: "coreEvents", image: "core-events", href: "/core-events" },
	{ id: "calculator", image: "calculator", href: "/wiki/calculator" },
];

export function Screens() {
	const t = useTranslations("landing.screens");

	return (
		<LandingSection id="screens" label={t("label")} title={t("title")}>
			<ul className="grid gap-4 lg:grid-cols-3">
				{screens.map(({ id, image, href }) => (
					<li key={id}>
						<Card className="flex h-full flex-col gap-3 p-3">
							<ScreenshotFrame name={image} alt={t(`items.${id}.alt`)} />
							<div className="flex flex-1 flex-col gap-2 px-2 pb-2">
								<h3 className="text-ink text-lg font-semibold">
									{t(`items.${id}.title`)}
								</h3>
								<p className="text-muted flex-1">{t(`items.${id}.description`)}</p>
								<Link
									href={href}
									className="text-link flex min-h-11 items-center gap-1.5 font-medium hover:underline lg:min-h-9"
								>
									{t("open", { page: t(`items.${id}.page`) })}
									<LuArrowRight
										className="rtl:rotate-180"
										size={16}
										aria-hidden="true"
									/>
								</Link>
							</div>
						</Card>
					</li>
				))}
			</ul>
		</LandingSection>
	);
}
