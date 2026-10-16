import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "History",
	robots: { index: false, follow: true },
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
	return children;
}
