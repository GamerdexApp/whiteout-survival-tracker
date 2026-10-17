import { useTranslations } from "next-intl";
import Link from "next/link";
import { navGroups, settingsNavItem } from "@/data/nav";
import { Card } from "@/comps/ui/Card";
import { LandingSection } from "./LandingSection";

const pageGroups = navGroups.map((group) =>
	group.id ? group : { ...group, items: [...group.items, settingsNavItem] }
);

export function AllPages() {
	const t = useTranslations("landing.pages");
	const tNav = useTranslations("shell.nav");

	return (
		<LandingSection id="pages" label={t("label")} title={t("title")} tinted>
			<p className="text-muted -mt-3">{t("description")}</p>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{pageGroups.map((group) => {
					const groupName = group.id ? tNav(`groups.${group.id}`) : t("general");
					return (
						<Card key={group.id ?? "general"} className="flex flex-col gap-2 p-4">
							<h3 className="text-ink font-semibold">{groupName}</h3>
							<ul
								aria-label={t("listLabel", { group: groupName })}
								className="flex flex-col"
							>
								{group.items.map(({ id, href, icon: Icon }) => (
									<li key={href}>
										<Link
											href={href}
											className="text-ink hover:bg-tint flex min-h-11 items-center gap-2.5 rounded-md px-2 lg:min-h-9"
										>
											<Icon
												size={16}
												aria-hidden="true"
												className="text-primary shrink-0"
											/>
											{tNav(`items.${id}`)}
										</Link>
									</li>
								))}
							</ul>
						</Card>
					);
				})}
			</div>
		</LandingSection>
	);
}
