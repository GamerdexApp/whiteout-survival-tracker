import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Experts",
	robots: { index: false, follow: true },
};

export default function ExpertsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
