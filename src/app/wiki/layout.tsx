import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Wiki",
};

export default function WikiLayout({ children }: { children: React.ReactNode }) {
	return children;
}
