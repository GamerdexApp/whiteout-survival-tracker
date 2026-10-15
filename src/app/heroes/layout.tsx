import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Heroes",
	robots: { index: false, follow: true },
};

export default function HeroesLayout({ children }: { children: React.ReactNode }) {
	return children;
}
