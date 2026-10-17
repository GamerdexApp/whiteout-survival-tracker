import { useTranslations } from "next-intl";
import Link from "next/link";
import { APP_NAME } from "@/data/nav";
import { SettingsCard } from "./SettingsCard";

export function AboutTab() {
	const t = useTranslations("settings.about");

	return (
		<div className="max-w-2xl">
			<SettingsCard
				title={APP_NAME}
				description={t("version", { version: process.env.NEXT_PUBLIC_APP_VERSION ?? "" })}
			>
				<p>{t("summary")}</p>
				<p>
					<Link
						href="/wiki"
						className="text-link inline-flex min-h-11 items-center font-medium underline lg:min-h-9"
					>
						{t("wiki")}
					</Link>
				</p>
				<p className="text-muted">{t("disclaimer")}</p>
			</SettingsCard>
		</div>
	);
}
