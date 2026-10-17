"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { calculatorBySlug, calculators } from "@/data/calculators";
import { Card } from "@/comps/ui/Card";
import { calculatorComponents } from "../calculators/registry";
import type { WikiPageProps } from "../WikiPageProps";
import { WikiPageShell } from "../WikiPageShell";
import { WikiRecordMissing } from "../WikiRecordMissing";

export function CalculatorPage({ recordId }: WikiPageProps) {
	const t = useTranslations("wikiCalculator");

	if (recordId === undefined) {
		return (
			<WikiPageShell id="calculator" line={t("line")}>
				<ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{calculators.map(({ id, slug }) => (
						<li key={id}>
							<Link href={`/wiki/calculator/${slug}`} className="block h-full">
								<Card className="hover:bg-tint flex h-full min-h-11 flex-col gap-1 p-4">
									<span className="font-semibold">
										{t(`calculators.${id}.title`)}
									</span>
									<span className="text-muted">
										{t(`calculators.${id}.description`)}
									</span>
								</Card>
							</Link>
						</li>
					))}
				</ul>
			</WikiPageShell>
		);
	}

	const info = calculatorBySlug(recordId);
	if (!info) return <WikiRecordMissing id="calculator" />;
	const Calculator = calculatorComponents[info.id];

	return (
		<WikiPageShell
			id="calculator"
			recordName={t(`calculators.${info.id}.title`)}
			line={t("recordLine")}
		>
			<Calculator />
		</WikiPageShell>
	);
}
