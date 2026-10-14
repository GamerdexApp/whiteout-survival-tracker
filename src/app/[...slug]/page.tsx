import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routes } from "@/data/nav";
import { PageHeader } from "@/comps/layout/PageHeader";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";

const buildPhaseByHref: Record<string, number> = {
	"/buildings": 3,
	"/resources": 4,
	"/bonuses": 4,
	"/research": 5,
	"/heroes": 6,
	"/chief-gear": 6,
	"/troops": 7,
	"/experts": 7,
	"/pets": 7,
	"/alliance": 8,
	"/facilities": 8,
	"/tech": 8,
	"/core-events": 9,
	"/history": 9,
	"/events": 10,
	"/dailies": 10,
	"/daybreak-island": 10,
	"/tundra-album": 10,
	"/overview": 11,
	"/skins": 11,
	"/vip": 11,
	"/wiki": 12,
	"/wiki/timeline": 12,
};

type PageProps = { params: Promise<{ slug: string[] }> };

const findRoute = async (params: PageProps["params"]) => {
	const { slug } = await params;
	const href = `/${slug.join("/")}`;
	return routes.find((route) => route.href === href && route.href in buildPhaseByHref);
};

export const generateStaticParams = () =>
	routes
		.filter((route) => route.href in buildPhaseByHref)
		.map((route) => ({ slug: route.href.slice(1).split("/") }));

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const route = await findRoute(params);
	return { title: route?.label };
}

export default async function PlaceholderPage({ params }: PageProps) {
	const route = await findRoute(params);
	if (!route) notFound();

	return (
		<>
			<PageHeader title={route.label} />
			<Card className="flex flex-col items-start gap-3 p-6">
				<Badge tone="locked">Phase {buildPhaseByHref[route.href]}</Badge>
				<h2 className="text-lg font-semibold">{route.label} is not built yet</h2>
				<p className="text-muted">
					This page arrives in phase {buildPhaseByHref[route.href]} of the build.
				</p>
			</Card>
		</>
	);
}
