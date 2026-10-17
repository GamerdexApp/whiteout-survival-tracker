import { translator } from "@/i18n/formatter";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/pageMetadata";
import { wikiPageBySlug, wikiPages } from "@/data/wiki";
import { WikiPageView } from "@/comps/wiki/WikiPageView";

type PageProps = { params: Promise<{ page: string }> };

export const generateStaticParams = () => wikiPages.map((page) => ({ page: page.slug }));

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const info = wikiPageBySlug((await params).page);
	if (!info) notFound();

	const t = translator("wiki");
	return pageMetadata({
		title: t(`pages.${info.id}.title`),
		description: t(`pages.${info.id}.description`),
		path: `/wiki/${info.slug}`,
	});
}

export default async function WikiReferencePage({ params }: PageProps) {
	const info = wikiPageBySlug((await params).page);
	if (!info) notFound();

	return <WikiPageView id={info.id} />;
}
