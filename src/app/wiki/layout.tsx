import type { Metadata } from "next";
import { APP_NAME } from "@/data/nav";

export const metadata: Metadata = {
	title: { default: "Wiki", template: `%s | ${APP_NAME}` },
	robots: { index: true, follow: true },
};

export default function WikiLayout({ children }: { children: React.ReactNode }) {
	return children;
}
