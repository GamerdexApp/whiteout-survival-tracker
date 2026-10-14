import Link from "next/link";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { BrandMark } from "./BrandMark";

const footerLinkClasses = "flex min-h-7 items-center text-sb-text hover:underline";

export function Footer() {
	return (
		<footer className="bg-sb-bg text-sb-text flex flex-col gap-6 px-4 pt-10 pb-7 [--ring:var(--color-sb-active-bg)] lg:px-8">
			<div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1.4fr]">
				<div className="flex min-w-0 flex-col gap-3">
					<BrandMark />
					<span className="text-sb-muted">
						Track your Whiteout Survival chiefs, buildings, heroes and research in one
						place.
					</span>
				</div>
				<nav aria-label="Support" className="flex min-w-0 flex-col gap-1.5">
					<SectionLabel className="text-sb-muted">Support</SectionLabel>
					<Link href="/settings" className={footerLinkClasses}>
						Settings
					</Link>
				</nav>
				<div className="flex min-w-0 flex-col gap-1.5">
					<SectionLabel className="text-sb-muted">About</SectionLabel>
					<Link href="/wiki" className={footerLinkClasses}>
						Whiteout Survival wiki
					</Link>
					<div className="border-sb-line mt-1.5 flex flex-col gap-1 rounded-md border-[1.5px] px-3.5 py-3">
						<span className="font-semibold">Disclaimer</span>
						<span className="text-sb-muted text-[13px]">
							This application is not affiliated with, endorsed by, or connected to
							Whiteout Survival or Century Games. All trademarks and game content are
							the property of their respective owners.
						</span>
					</div>
				</div>
			</div>
			<div className="border-sb-line text-sb-muted flex flex-wrap items-center justify-between gap-4 border-t-[1.5px] pt-4 text-[13px]">
				<span>&copy; {new Date().getFullYear()} Whiteout Survival Tracker</span>
				<span>
					Built with the Gamerdex framework, a shared base for free game progress
					trackers. Your data stays in your browser.
				</span>
			</div>
		</footer>
	);
}
