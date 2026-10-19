import { useTranslations } from "next-intl";
import Link from "next/link";
import { LuArrowUpRight } from "react-icons/lu";
import { APP_NAME } from "@/data/nav";
import { DISCORD_URL, GAMERDEX_URL } from "@/data/site";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { BrandMark } from "./BrandMark";

const footerLinkClasses = "flex min-h-11 items-center text-sb-text hover:underline md:min-h-9";
const externalLinkClasses = `${footerLinkClasses} gap-1`;

export function Footer() {
	const t = useTranslations("shell");

	return (
		<footer className="bg-sb-bg text-sb-text flex flex-col gap-6 px-4 pt-10 pb-7 [--ring:var(--color-sb-active-bg)] lg:px-8">
			<div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr_1.4fr]">
				<div className="flex min-w-0 flex-col gap-3">
					<BrandMark />
					<span className="text-sb-muted">{t("footer.tagline")}</span>
				</div>
				<nav aria-label={t("footer.product")} className="flex min-w-0 flex-col gap-1.5">
					<SectionLabel className="text-sb-muted">{t("footer.product")}</SectionLabel>
					<Link href="/chiefs" className={footerLinkClasses}>
						{t("nav.items.chiefs")}
					</Link>
					<Link href="/overview" className={footerLinkClasses}>
						{t("nav.items.overview")}
					</Link>
					<Link href="/wiki" className={footerLinkClasses}>
						{t("footer.wikiReference")}
					</Link>
					<Link href="/wiki/timeline" className={footerLinkClasses}>
						{t("footer.wikiTimeline")}
					</Link>
				</nav>
				<nav aria-label={t("footer.support")} className="flex min-w-0 flex-col gap-1.5">
					<SectionLabel className="text-sb-muted">{t("footer.support")}</SectionLabel>
					<Link href="/settings" className={footerLinkClasses}>
						{t("nav.items.settings")}
					</Link>
					<Link href="/settings?tab=data" className={footerLinkClasses}>
						{t("footer.backupAndData")}
					</Link>
					<Link href="/settings?tab=about" className={footerLinkClasses}>
						{t("footer.aboutApp")}
					</Link>
					<a href={`${GAMERDEX_URL}/privacy`} className={externalLinkClasses}>
						{t("footer.privacyPolicy")}
						<LuArrowUpRight
							size={14}
							aria-hidden="true"
							className="shrink-0 rtl:-scale-x-100"
						/>
					</a>
					<a href={`${GAMERDEX_URL}/terms`} className={externalLinkClasses}>
						{t("footer.termsOfService")}
						<LuArrowUpRight
							size={14}
							aria-hidden="true"
							className="shrink-0 rtl:-scale-x-100"
						/>
					</a>
				</nav>
				<div className="flex min-w-0 flex-col gap-3 self-start">
					{DISCORD_URL && (
						<a href={DISCORD_URL} className={externalLinkClasses}>
							{t("footer.discord")}
							<LuArrowUpRight
								size={14}
								aria-hidden="true"
								className="shrink-0 rtl:-scale-x-100"
							/>
						</a>
					)}
					<div className="border-sb-line flex flex-col gap-1 rounded-md border-[1.5px] px-3.5 py-3">
						<span className="font-semibold">{t("footer.disclaimerTitle")}</span>
						<span className="text-sb-muted text-[13px]">{t("footer.disclaimer")}</span>
					</div>
				</div>
			</div>
			<div className="border-sb-line text-sb-muted flex flex-wrap items-center justify-between gap-4 border-t-[1.5px] pt-4 text-[13px]">
				<span>
					{t("footer.copyright", {
						year: String(new Date().getFullYear()),
						appName: APP_NAME,
					})}
				</span>
				<span>{t("footer.framework")}</span>
			</div>
		</footer>
	);
}
