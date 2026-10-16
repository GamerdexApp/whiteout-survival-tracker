import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Events",
	robots: { index: false, follow: true },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
