import { useTranslations } from "next-intl";
import Link from "next/link";
import { APP_NAME } from "@/data/nav";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { BrandMark } from "./BrandMark";

const footerLinkClasses = "flex min-h-7 items-center text-sb-text hover:underline";

export function Footer() {
	const t = useTranslations("shell");

	return (
		<footer className="bg-sb-bg text-sb-text flex flex-col gap-6 px-4 pt-10 pb-7 [--ring:var(--color-sb-active-bg)] lg:px-8">
			<div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1.4fr]">
				<div className="flex min-w-0 flex-col gap-3">
					<BrandMark />
					<span className="text-sb-muted">{t("footer.tagline")}</span>
				</div>
				<nav aria-label={t("footer.support")} className="flex min-w-0 flex-col gap-1.5">
					<SectionLabel className="text-sb-muted">{t("footer.support")}</SectionLabel>
					<Link href="/settings" className={footerLinkClasses}>
						{t("nav.items.settings")}
					</Link>
				</nav>
				<div className="flex min-w-0 flex-col gap-1.5">
					<SectionLabel className="text-sb-muted">{t("footer.about")}</SectionLabel>
					<Link href="/wiki" className={footerLinkClasses}>
						{t("footer.wiki")}
					</Link>
					<div className="border-sb-line mt-1.5 flex flex-col gap-1 rounded-md border-[1.5px] px-3.5 py-3">
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
