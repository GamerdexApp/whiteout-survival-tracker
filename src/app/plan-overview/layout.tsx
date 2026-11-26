import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Plan Overview",
	robots: { index: false, follow: true },
};

export default function PlanOverviewLayout({ children }: { children: React.ReactNode }) {
	return children;
}
