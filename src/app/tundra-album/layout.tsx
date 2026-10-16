import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Tundra Album",
	robots: { index: false, follow: true },
};

export default function TundraAlbumLayout({ children }: { children: React.ReactNode }) {
	return children;
}
