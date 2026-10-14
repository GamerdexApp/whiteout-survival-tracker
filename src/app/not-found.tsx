"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsHydrated } from "@/lib/hooks/useIsHydrated";
import { suggestRoute } from "@/data/nav";
import { ButtonLink } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const jumpLinks = [
	{ label: "Overview", href: "/overview" },
	{ label: "Chiefs", href: "/chiefs" },
	{ label: "Buildings", href: "/buildings" },
	{ label: "Settings", href: "/settings" },
];

export default function NotFound() {
	const pathname = usePathname();
	const isHydrated = useIsHydrated();
	const suggestion = isHydrated ? suggestRoute(pathname) : null;

	return (
		<Card className="flex flex-col items-start gap-4 p-6">
			<SectionLabel className="text-muted">404</SectionLabel>
			<h1 className="text-2xl font-semibold">This page does not exist</h1>
			<p className="text-muted">
				The link may be old or mistyped. Your chiefs are safe and nothing was changed.
			</p>
			{isHydrated && (
				<code className="bg-track rounded-md px-2 py-1 font-mono text-xs">{pathname}</code>
			)}
			{suggestion && (
				<p>
					Did you mean{" "}
					<Link href={suggestion.href} className="text-link font-medium underline">
						{suggestion.label}
					</Link>
					?
				</p>
			)}
			<ButtonLink href="/overview" variant="primary">
				Go to Overview
			</ButtonLink>
			<div className="flex flex-col gap-2">
				<SectionLabel className="text-muted">Or jump to</SectionLabel>
				<div className="flex flex-wrap gap-2">
					{jumpLinks.map((link) => (
						<ButtonLink key={link.href} href={link.href}>
							{link.label}
						</ButtonLink>
					))}
				</div>
			</div>
		</Card>
	);
}
