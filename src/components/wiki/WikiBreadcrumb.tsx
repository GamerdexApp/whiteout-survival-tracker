"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export interface BreadcrumbStep {
	label: string;
	/** The last step is the current page and has no link. */
	href?: string;
}

const linkClasses =
	"hover:text-ink inline-flex min-h-11 items-center underline min-w-11 justify-center lg:min-h-9 lg:min-w-9";

/** Wiki first, then the steps down to the current page. */
export function WikiBreadcrumb({ steps }: { steps: BreadcrumbStep[] }) {
	const t = useTranslations("wiki");

	return (
		<nav
			aria-label={t("breadcrumb")}
			className="text-muted flex flex-wrap items-center gap-x-1.5 text-xs"
		>
			<Link href="/wiki" className={linkClasses}>
				{t("breadcrumb")}
			</Link>
			{steps.map((step) => (
				<span key={step.label} className="flex items-center gap-1.5">
					<span aria-hidden="true">/</span>
					{step.href ? (
						<Link href={step.href} className={linkClasses}>
							{step.label}
						</Link>
					) : (
						<span aria-current="page" className="text-ink">
							{step.label}
						</span>
					)}
				</span>
			))}
		</nav>
	);
}
