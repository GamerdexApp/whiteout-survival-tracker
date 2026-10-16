import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Daybreak Island",
	robots: { index: false, follow: true },
};

export default function DaybreakIslandLayout({ children }: { children: React.ReactNode }) {
	return children;
}
