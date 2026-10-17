"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";
import { formatNumber } from "@/lib/format";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { describeChief } from "@/service/chiefs";
import { ButtonLink } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { ScreenshotFrame } from "./ScreenshotFrame";
import { useLandingAction } from "./useLandingAction";

function ContinueCard() {
	const t = useTranslations("landing");
	const { ui } = useUiSettings();
	const { returningChief, chiefCount } = useLandingAction();

	if (!returningChief) return null;

	return (
		<Card className="flex flex-col gap-3 p-4" highlighted>
			<SectionLabel className="text-muted">{t("continue.label")}</SectionLabel>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex min-w-0 flex-col">
					<h2 className="text-ink truncate text-lg font-semibold">
						{t("continue.title", { name: returningChief.name })}
					</h2>
					<span className="text-muted">
						{describeChief(returningChief, ui.furnaceFullLabels)}
					</span>
				</div>
				<Link
					href="/chiefs"
					className="text-link flex min-h-11 items-center gap-1.5 font-medium hover:underline lg:min-h-9"
				>
					{t("action.allChiefs")}
					<LuArrowRight className="rtl:rotate-180" size={16} aria-hidden="true" />
				</Link>
			</div>
			<span className="text-muted text-[13px]">
				{t("continue.chiefCount", { count: chiefCount, amount: formatNumber(chiefCount) })}
			</span>
		</Card>
	);
}

function OverviewScreenshot() {
	const t = useTranslations("landing");

	return (
		<ScreenshotFrame
			name="overview"
			alt={t("hero.screenshotAlt")}
			className="hidden lg:block"
		/>
	);
}

export function Hero() {
	const t = useTranslations("landing");
	const { primary } = useLandingAction();

	return (
		<section aria-labelledby="hero-heading" className="bg-tint py-10 lg:py-16">
			<div className="mx-auto grid max-w-6xl items-center gap-8 px-4 lg:grid-cols-2 lg:px-8">
				<div className="flex flex-col gap-5">
					<SectionLabel className="text-primary">{t("hero.label")}</SectionLabel>
					<h1
						id="hero-heading"
						className="text-ink text-4xl leading-[1.1] font-semibold lg:text-5xl"
					>
						{t("hero.title")}
					</h1>
					<p className="text-muted max-w-xl text-base">{t("hero.description")}</p>
					<div className="flex flex-wrap gap-3">
						<ButtonLink href={primary.href} variant="primary">
							{t(`action.${primary.id}`)}
						</ButtonLink>
						<ButtonLink href="#how">{t("hero.learnMore")}</ButtonLink>
						<ButtonLink href="/wiki/calculator" variant="ghost">
							{t("hero.tryCalculators")}
						</ButtonLink>
					</div>
					<p className="text-muted text-[13px]">{t("hero.note")}</p>
					<ContinueCard />
				</div>
				<OverviewScreenshot />
			</div>
		</section>
	);
}
