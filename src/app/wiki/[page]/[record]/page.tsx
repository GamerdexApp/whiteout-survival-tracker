import { notFound } from "next/navigation";
import { wikiPageBySlug } from "@/data/wiki";
import { WikiPageView } from "@/comps/wiki/WikiPageView";

type PageProps = { params: Promise<{ page: string; record: string }> };

export default async function WikiRecordPage({ params }: PageProps) {
	const { page, record } = await params;
	const info = wikiPageBySlug(page);
	if (!info) notFound();

	return <WikiPageView id={info.id} recordId={decodeURIComponent(record)} />;
}
