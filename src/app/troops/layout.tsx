import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Troops",
	robots: { index: false, follow: true },
};

export default function TroopsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
