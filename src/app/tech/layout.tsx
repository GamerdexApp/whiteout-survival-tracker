import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Tech",
	robots: { index: false, follow: true },
};

export default function TechLayout({ children }: { children: React.ReactNode }) {
	return children;
}
