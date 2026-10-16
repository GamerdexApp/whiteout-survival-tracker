import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Skins",
	robots: { index: false, follow: true },
};

export default function SkinsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
