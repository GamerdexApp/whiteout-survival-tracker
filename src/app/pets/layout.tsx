import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Pets",
	robots: { index: false, follow: true },
};

export default function PetsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
