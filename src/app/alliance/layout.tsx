import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Alliance",
	robots: { index: false, follow: true },
};

export default function AllianceLayout({ children }: { children: React.ReactNode }) {
	return children;
}
