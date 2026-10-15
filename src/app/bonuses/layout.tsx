import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Bonuses",
	robots: { index: false, follow: true },
};

export default function BonusesLayout({ children }: { children: React.ReactNode }) {
	return children;
}
