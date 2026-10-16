import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "VIP",
	robots: { index: false, follow: true },
};

export default function VipLayout({ children }: { children: React.ReactNode }) {
	return children;
}
