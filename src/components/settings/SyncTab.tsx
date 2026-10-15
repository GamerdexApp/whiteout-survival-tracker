import { useTranslations } from "next-intl";
import { Badge } from "@/comps/ui/Badge";
import { Note } from "@/comps/ui/Note";
import { SettingsCard } from "./SettingsCard";

const providers = ["googleDrive", "dropbox", "oneDrive", "gitHub"] as const;

export function SyncTab() {
	const t = useTranslations("settings");

	return (
		<div className="grid items-start gap-4 lg:grid-cols-2">
			<div className="flex flex-col gap-4">
				<Note title={t("localStorageNote.title")}>{t("localStorageNote.body")}</Note>
				<SettingsCard
					title={t("sync.title")}
					description={t("sync.description")}
					aside={<Badge tone="locked">{t("sync.notConnected")}</Badge>}
				>
					<ul className="flex flex-col gap-2">
						{providers.map((provider) => (
							<li
								key={t(`sync.providers.${provider}`)}
								className="border-line text-muted flex min-h-11 items-center justify-between gap-3 rounded-md border-[1.5px] px-3"
							>
								{t(`sync.providers.${provider}`)}
								<Badge tone="locked">{t("sync.comingLater")}</Badge>
							</li>
						))}
					</ul>
				</SettingsCard>
			</div>
		</div>
	);
}
