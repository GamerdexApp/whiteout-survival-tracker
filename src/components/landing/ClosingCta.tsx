"use client";

import { useTranslations } from "next-intl";
import { ButtonLink } from "@/comps/ui/Button";
import { useLandingAction } from "./useLandingAction";

export function ClosingCta() {
	const t = useTranslations("landing.closing");
	const tAction = useTranslations("landing.action");
	const { primary } = useLandingAction();

	return (
		<section aria-labelledby="closing-heading" className="bg-tint py-10 lg:py-14">
			<div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 lg:px-8">
				<h2 id="closing-heading" className="text-ink text-2xl font-semibold lg:text-3xl">
					{t("title")}
				</h2>
				<p className="text-muted">{t("description")}</p>
				<div className="flex flex-wrap gap-3">
					<ButtonLink href={primary.href} variant="primary">
						{tAction(primary.id)}
					</ButtonLink>
					<ButtonLink href="/wiki">{t("wiki")}</ButtonLink>
				</div>
			</div>
		</section>
	);
}
