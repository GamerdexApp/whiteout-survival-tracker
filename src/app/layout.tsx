import { I18nProvider } from "@/i18n/I18nProvider";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Lilita_One } from "next/font/google";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { SyncProvider } from "@/lib/contexts/SyncContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { STORAGE_KEY } from "@/service/storage";
import { APP_NAME } from "@/data/nav";
import { SITE_DESCRIPTION, SITE_URL } from "@/data/site";
import { AppShell } from "@/comps/layout/AppShell";
import { SiteJsonLd } from "@/comps/seo/SiteJsonLd";
import { ToastProvider } from "@/comps/ui/Toast";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
	variable: "--font-plex-sans",
	subsets: ["latin"],
	weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
	variable: "--font-plex-mono",
	subsets: ["latin"],
	weight: ["400", "500"],
});

const lilita = Lilita_One({
	variable: "--font-lilita",
	subsets: ["latin"],
	weight: "400",
});

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: APP_NAME,
		template: `%s | ${APP_NAME}`,
	},
	description: SITE_DESCRIPTION,
	keywords: ["Whiteout Survival", "progress tracker", "game companion", "planner"],
	robots: {
		index: true,
		follow: true,
	},
	openGraph: {
		type: "website",
		siteName: APP_NAME,
		title: APP_NAME,
		description: SITE_DESCRIPTION,
	},
	twitter: {
		card: "summary_large_image",
		title: APP_NAME,
		description: SITE_DESCRIPTION,
	},
};

const applyThemeBeforePaint = `try{var s=JSON.parse(localStorage.getItem("${STORAGE_KEY}")||"{}").settings;var t=s&&s.theme||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}`;

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${plexSans.variable} ${plexMono.variable} ${lilita.variable}`}
		>
			<head>
				<script dangerouslySetInnerHTML={{ __html: applyThemeBeforePaint }} />
			</head>
			<body className="min-h-dvh">
				<SiteJsonLd />
				<I18nProvider>
					<UIProvider>
						<ToastProvider>
							<PlaythroughProvider>
								<SyncProvider>
									<AppShell>{children}</AppShell>
								</SyncProvider>
							</PlaythroughProvider>
						</ToastProvider>
					</UIProvider>
				</I18nProvider>
			</body>
		</html>
	);
}
