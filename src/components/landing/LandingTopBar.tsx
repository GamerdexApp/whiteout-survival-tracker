"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { APP_NAME } from "@/data/nav";
import { ButtonLink } from "@/comps/ui/Button";
import { useLandingAction } from "./useLandingAction";

const anchorIds = ["how", "features", "privacy", "faq"] as const;

export function LandingTopBar() {
	const t = useTranslations("landing");
	const { primary } = useLandingAction();

	return (
		<header className="bg-surface border-line border-b-[1.5px]">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
				<Link href="/" className="flex items-center gap-2.5">
					<img
						src="/app-icon.jpg"
						alt=""
						width={44}
						height={44}
						className="block size-11 shrink-0 rounded-lg"
					/>
					<span className="font-brand text-ink flex flex-col text-[17px] leading-[1.05]">
						{/* i18n-ignore */}
						<span>Whiteout Survival</span>
						{/* i18n-ignore */}
						<span className="text-muted">Tracker</span>
					</span>
					<span className="sr-only">{APP_NAME}</span>
				</Link>
				<nav aria-label={t("topBar.navLabel")} className="flex items-center gap-2">
					<ul className="hidden items-center gap-1 md:flex">
						{anchorIds.map((id) => (
							<li key={id}>
								<a
									href={`#${id}`}
									className="text-ink hover:bg-tint flex min-h-11 items-center rounded-md px-3 lg:min-h-9"
								>
									{t(`topBar.links.${id}`)}
								</a>
							</li>
						))}
					</ul>
					<ButtonLink href={primary.href} variant="primary">
						{t(`action.${primary.id}`)}
					</ButtonLink>
				</nav>
			</div>
		</header>
	);
}
