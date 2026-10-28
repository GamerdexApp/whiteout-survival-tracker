import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Labyrinth",
	robots: { index: false, follow: true },
};

export default function LabyrinthLayout({ children }: { children: React.ReactNode }) {
	return children;
}
