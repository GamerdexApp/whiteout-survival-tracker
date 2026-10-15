"use client";

import { useTranslations } from "next-intl";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { themeIds } from "@/data/settings";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { SwitchRow } from "@/comps/ui/Switch";
import { RegionCard } from "./RegionCard";
import { SettingsCard } from "./SettingsCard";

function GroupLabel({ children }: { children: string }) {
	return (
		<h3 className="text-muted pt-2 font-mono text-[11px] tracking-[0.08em] uppercase">
			{children}
		</h3>
	);
}

export function PreferencesTab() {
	const t = useTranslations("settings.preferences");
	const { settings, updateSettings } = usePlaythrough();
	const { ui, setUi } = useUiSettings();
	const systemIsDark = useMediaQuery("(prefers-color-scheme: dark)");
	const themeOptions = themeIds.map((id) => ({ id, label: t(`themes.${id}`) }));
	const systemTheme = t(systemIsDark ? "themes.dark" : "themes.light");

	return (
		<div className="grid items-start gap-4 lg:grid-cols-2">
			<SettingsCard
				title={t("chiefSettings.title")}
				description={t("chiefSettings.description")}
			>
				<GroupLabel>{t("chiefSettings.groups.furnaceDisplay")}</GroupLabel>
				<SwitchRow
					label={t("chiefSettings.fullLevelLabels.label")}
					description={t("chiefSettings.fullLevelLabels.description")}
					checked={ui.furnaceFullLabels}
					onChange={(checked) => setUi({ furnaceFullLabels: checked })}
				/>
				<GroupLabel>{t("chiefSettings.groups.lists")}</GroupLabel>
				<SwitchRow
					label={t("chiefSettings.hideMaxed.label")}
					description={t("chiefSettings.hideMaxed.description")}
					checked={ui.hideMaxed}
					onChange={(checked) => setUi({ hideMaxed: checked })}
				/>
				<GroupLabel>{t("chiefSettings.groups.calculatorOptions")}</GroupLabel>
				<SwitchRow
					label={t("chiefSettings.useBonuses.label")}
					description={t("chiefSettings.useBonuses.description")}
					checked={ui.calcUseBonuses}
					onChange={(checked) => setUi({ calcUseBonuses: checked })}
				/>
				<SwitchRow
					label={t("chiefSettings.showSpeedups.label")}
					description={t("chiefSettings.showSpeedups.description")}
					checked={ui.calcShowSpeedups}
					onChange={(checked) => setUi({ calcShowSpeedups: checked })}
				/>
				<SwitchRow
					label={t("chiefSettings.showEventPoints.label")}
					description={t("chiefSettings.showEventPoints.description")}
					checked={ui.calcShowEventPoints}
					onChange={(checked) => setUi({ calcShowEventPoints: checked })}
				/>
				<p className="text-muted">{t("chiefSettings.footnote")}</p>
			</SettingsCard>
			<SettingsCard title={t("appearance.title")} description={t("appearance.description")}>
				<RadioGroup
					label={t("appearance.themeLabel")}
					options={themeOptions}
					value={settings.theme ?? "system"}
					onChange={(theme) => updateSettings({ theme })}
				/>
				<p className="text-muted">{t("appearance.themeNote", { current: systemTheme })}</p>
			</SettingsCard>
			<RegionCard />
		</div>
	);
}
