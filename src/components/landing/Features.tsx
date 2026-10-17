import { useTranslations } from "next-intl";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
	LuArrowRight,
	LuFlaskConical,
	LuHandshake,
	LuHistory,
	LuListChecks,
	LuTarget,
	LuTrendingUp,
} from "react-icons/lu";
import { Card } from "@/comps/ui/Card";
import { LandingSection } from "./LandingSection";

type FeatureId = "plan" | "coreEvents" | "eventLog" | "history" | "research" | "alliance";

const features: { id: FeatureId; href: string; icon: IconType }[] = [
	{ id: "plan", href: "/buildings", icon: LuTrendingUp },
	{ id: "coreEvents", href: "/core-events", icon: LuTarget },
	{ id: "eventLog", href: "/core-events", icon: LuListChecks },
	{ id: "history", href: "/history", icon: LuHistory },
	{ id: "research", href: "/research", icon: LuFlaskConical },
	{ id: "alliance", href: "/alliance", icon: LuHandshake },
];

export function Features() {
	const t = useTranslations("landing.features");

	return (
		<LandingSection id="features" label={t("label")} title={t("title")} tinted>
			<ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{features.map(({ id, href, icon: Icon }) => (
					<li key={id}>
						<Card className="flex h-full flex-col gap-3 p-5">
							<span className="bg-tint text-primary flex size-10 items-center justify-center rounded-md">
								<Icon size={20} aria-hidden="true" />
							</span>
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
						</Card>
					</li>
				))}
			</ul>
		</LandingSection>
	);
}
