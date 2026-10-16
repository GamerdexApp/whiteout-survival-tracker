import { translator } from "@/i18n/formatter";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routes } from "@/data/nav";
import { PlaceholderCard } from "./PlaceholderCard";

const buildPhaseByHref: Record<string, number> = {
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
	return { title: route && translator("shell")(`nav.items.${route.id}`) };
}

export default async function PlaceholderPage({ params }: PageProps) {
	const route = await findRoute(params);
	if (!route) notFound();

	return <PlaceholderCard routeId={route.id} phase={buildPhaseByHref[route.href]} />;
}
