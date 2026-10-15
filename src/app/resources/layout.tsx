import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Resources",
	robots: { index: false, follow: true },
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
	return children;
}
