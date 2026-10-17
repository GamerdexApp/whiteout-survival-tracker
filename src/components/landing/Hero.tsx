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

function OverviewSketch() {
	return (
		<div
			aria-hidden="true"
			className="bg-surface border-line hidden overflow-hidden rounded-md border-[1.5px] lg:block"
		>
			<div className="border-line flex gap-1.5 border-b-[1.5px] px-3 py-2">
				<span className="bg-track size-2 rounded-full" />
				<span className="bg-track size-2 rounded-full" />
				<span className="bg-track size-2 rounded-full" />
			</div>
			<div className="flex h-56">
				<div className="bg-sb-bg w-1/4" />
				<div className="flex flex-1 flex-col gap-3 p-4">
					<div className="bg-ink h-4 w-2/5 rounded-sm" />
					{["w-4/5", "w-3/5", "w-2/3", "w-1/2"].map((width) => (
						<div key={width} className="flex items-center gap-3">
							<div className="bg-track h-2.5 w-1/4 rounded-sm" />
							<div className="bg-track h-2.5 flex-1 rounded-sm">
								<div className={`bg-primary h-full rounded-sm ${width}`} />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
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
					</div>
					<p className="text-muted text-[13px]">{t("hero.note")}</p>
					<ContinueCard />
				</div>
				<OverviewSketch />
			</div>
		</section>
	);
}
