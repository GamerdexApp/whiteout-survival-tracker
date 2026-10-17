"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { wikiPages } from "@/data/wiki";
import { Card } from "@/comps/ui/Card";
import { Note } from "@/comps/ui/Note";

export function WikiIndex() {
	const t = useTranslations("wiki");

	return (
		<>
			<header className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold">{t("title")}</h1>
				<p className="text-muted">{t("subline")}</p>
			</header>
			<Note>{t("status")}</Note>
			<ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
				{wikiPages.map(({ id, slug, icon: Icon }) => (
					<li key={id}>
						<Link href={`/wiki/${slug}`} className="block h-full">
							<Card className="hover:bg-tint flex h-full min-h-11 items-start gap-3 p-4">
								<span
									aria-hidden="true"
									className="bg-tint text-primary flex size-10 shrink-0 items-center justify-center rounded-md"
								>
									<Icon size={20} />
								</span>
								<span className="flex min-w-0 flex-col gap-1">
									<span className="font-semibold">{t(`pages.${id}.title`)}</span>
									<span className="text-muted">
										{t(`pages.${id}.description`)}
									</span>
								</span>
							</Card>
						</Link>
					</li>
				))}
			</ul>
		</>
	);
}
