import { notFound } from "next/navigation";
import { wikiPageBySlug, wikiPages } from "@/data/wiki";
import { WikiPageView } from "@/comps/wiki/WikiPageView";

type PageProps = { params: Promise<{ page: string }> };

export const generateStaticParams = () => wikiPages.map((page) => ({ page: page.slug }));

export const dynamicParams = false;

export default async function WikiReferencePage({ params }: PageProps) {
	const info = wikiPageBySlug((await params).page);
	if (!info) notFound();

	return <WikiPageView id={info.id} />;
}
