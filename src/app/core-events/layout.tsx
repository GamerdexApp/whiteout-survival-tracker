import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Core Events",
	robots: { index: false, follow: true },
};

export default function CoreEventsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
