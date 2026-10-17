import { useTranslations } from "next-intl";
import Link from "next/link";
import type { IconType } from "react-icons";
import { LuArrowRight, LuBookOpen, LuCalculator } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import { landingCounts } from "@/data/game/landing";
import { Card } from "@/comps/ui/Card";
import { LandingSection } from "./LandingSection";

type ToolId = "calculators" | "wiki";

const tools: { id: ToolId; href: string; icon: IconType }[] = [
	{ id: "calculators", href: "/wiki/calculator", icon: LuCalculator },
	{ id: "wiki", href: "/wiki", icon: LuBookOpen },
];

export function Tools() {
	const t = useTranslations("landing.tools");

	return (
		<LandingSection id="tools" label={t("label")} title={t("title")} tinted>
			<p className="text-muted max-w-2xl">{t("description")}</p>
			<ul className="grid gap-4 md:grid-cols-2">
				{tools.map(({ id, href, icon: Icon }) => (
					<li key={id}>
						<Card className="flex h-full flex-col gap-3 p-5">
							<span className="bg-tint text-primary flex size-10 items-center justify-center rounded-md">
								<Icon size={20} aria-hidden="true" />
							</span>
							<h3 className="text-ink text-lg font-semibold">
								{t(`items.${id}.title`, {
									amount: formatNumber(landingCounts.calculators),
								})}
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
						</Card>
					</li>
				))}
			</ul>
		</LandingSection>
	);
}
