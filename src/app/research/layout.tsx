import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Research",
	robots: { index: false, follow: true },
};

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
	return children;
}
