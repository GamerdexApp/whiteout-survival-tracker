import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Buildings",
	robots: { index: false, follow: true },
};

export default function BuildingsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
