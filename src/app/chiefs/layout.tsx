import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Chiefs",
	robots: { index: false, follow: true },
};

export default function ChiefsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
