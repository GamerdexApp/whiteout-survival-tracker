"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsHydrated } from "@/lib/hooks/useIsHydrated";
import { suggestRoute } from "@/data/nav";
import { ButtonLink } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const jumpLinks = [
	{ id: "overview", href: "/overview" },
	{ id: "chiefs", href: "/chiefs" },
	{ id: "buildings", href: "/buildings" },
	{ id: "settings", href: "/settings" },
] as const;

export default function NotFound() {
	const t = useTranslations("shell");
	const pathname = usePathname();
	const isHydrated = useIsHydrated();
	const suggestion = isHydrated ? suggestRoute(pathname) : null;

	return (
		<Card className="flex flex-col items-start gap-4 p-6">
			<SectionLabel className="text-muted">404</SectionLabel>
			<h1 className="text-2xl font-semibold">{t("notFound.title")}</h1>
			<p className="text-muted">{t("notFound.description")}</p>
			{isHydrated && (
				<code className="bg-track rounded-md px-2 py-1 font-mono text-xs">{pathname}</code>
			)}
			{suggestion && (
				<p>
					{t.rich("notFound.didYouMean", {
						name: t(`nav.items.${suggestion.id}`),
						link: (chunks) => (
							<Link
								href={suggestion.href}
								className="text-link font-medium underline"
							>
								{chunks}
							</Link>
						),
					})}
				</p>
			)}
			<ButtonLink href="/overview" variant="primary">
				{t("notFound.goToOverview")}
			</ButtonLink>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{t("notFound.jumpTo")}</SectionLabel>
				<div className="flex flex-wrap gap-2">
					{jumpLinks.map((link) => (
						<ButtonLink key={link.href} href={link.href}>
							{t(`nav.items.${link.id}`)}
						</ButtonLink>
					))}
				</div>
			</div>
		</Card>
	);
}
