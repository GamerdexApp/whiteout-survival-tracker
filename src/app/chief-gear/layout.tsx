import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Chief Gear",
	robots: { index: false, follow: true },
};

export default function ChiefGearLayout({ children }: { children: React.ReactNode }) {
	return children;
}
