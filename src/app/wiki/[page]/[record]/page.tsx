import { translator } from "@/i18n/formatter";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/pageMetadata";
import { wikiPageBySlug } from "@/data/wiki";
import { WikiPageView } from "@/comps/wiki/WikiPageView";

type PageProps = { params: Promise<{ page: string; record: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { page, record } = await params;
	const info = wikiPageBySlug(page);
	if (!info) notFound();

	const t = translator("wiki");
	return pageMetadata({
		title: t(`pages.${info.id}.title`),
		description: t(`pages.${info.id}.description`),
		path: `/wiki/${info.slug}/${record}`,
	});
}

export default async function WikiRecordPage({ params }: PageProps) {
	const { page, record } = await params;
	const info = wikiPageBySlug(page);
	if (!info) notFound();

	return <WikiPageView id={info.id} recordId={decodeURIComponent(record)} />;
}
