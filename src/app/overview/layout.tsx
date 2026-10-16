import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Overview",
	robots: { index: false, follow: true },
};

export default function OverviewLayout({ children }: { children: React.ReactNode }) {
	return children;
}
