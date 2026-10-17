import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { APP_NAME } from "@/data/nav";
import { SITE_DESCRIPTION } from "@/data/site";
import { LandingPage } from "@/comps/landing/LandingPage";

const base = pageMetadata({ title: APP_NAME, description: SITE_DESCRIPTION, path: "/" });

export const metadata: Metadata = {
	...base,
	title: { absolute: APP_NAME },
	openGraph: { ...base.openGraph, title: APP_NAME },
	twitter: { ...base.twitter, title: APP_NAME },
};

export default function HomePage() {
	return <LandingPage />;
}
