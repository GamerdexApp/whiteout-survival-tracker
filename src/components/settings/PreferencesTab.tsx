"use client";

import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useUiSettings } from "@/lib/hooks/useUiSettings";
import { themeOptions } from "@/data/settings";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { SwitchRow } from "@/comps/ui/Switch";
import { SettingsCard } from "./SettingsCard";

function GroupLabel({ children }: { children: string }) {
	return (
		<h3 className="text-muted pt-2 font-mono text-[11px] tracking-[0.08em] uppercase">
			{children}
		</h3>
	);
}

export function PreferencesTab() {
	const { settings, updateSettings } = usePlaythrough();
	const { ui, setUi } = useUiSettings();
	const systemIsDark = useMediaQuery("(prefers-color-scheme: dark)");

	return (
		<div className="grid items-start gap-4 lg:grid-cols-2">
			<SettingsCard title="Chief settings" description="Apply to every chief. Saved at once.">
				<GroupLabel>Furnace display</GroupLabel>
				<SwitchRow
					label="Show full level labels"
					description="Shows the sub level on the Furnace, for example FC 5-2 instead of FC 5, in the sidebar, on Overview and on Buildings. Other buildings already show their full label."
					checked={ui.furnaceFullLabels}
					onChange={(checked) => setUi({ furnaceFullLabels: checked })}
				/>
				<GroupLabel>Lists</GroupLabel>
				<SwitchRow
					label="Hide maxed items"
					description="Hides buildings, heroes, pets and experts that are at their top level. Each list keeps a Show maxed filter, so nothing is lost."
					checked={ui.hideMaxed}
					onChange={(checked) => setUi({ hideMaxed: checked })}
				/>
				<GroupLabel>Default calculator options</GroupLabel>
				<SwitchRow
					label="Apply my Bonuses totals"
					description="New calculators start with the construction speed percent from the Bonuses page. A calculator can still change it for one run."
					checked={ui.calcUseBonuses}
					onChange={(checked) => setUi({ calcUseBonuses: checked })}
				/>
				<SwitchRow
					label="Show speedup minutes"
					description="Shows the speedup minutes needed under the time in each calculator result."
					checked={ui.calcShowSpeedups}
					onChange={(checked) => setUi({ calcShowSpeedups: checked })}
				/>
				<SwitchRow
					label="Show event points"
					description="Adds the event points line to calculator results that return it."
					checked={ui.calcShowEventPoints}
					onChange={(checked) => setUi({ calcShowEventPoints: checked })}
				/>
				<p className="text-muted">
					Changing an option inside a calculator does not change these defaults. The
					Furnace display only changes how a level is written, never the level itself.
					Adding or deleting a chief never resets these settings.
				</p>
			</SettingsCard>
			<SettingsCard
				title="Appearance"
				description="Pick how the app looks. Saved with your data."
			>
				<RadioGroup
					label="Theme"
					options={themeOptions}
					value={settings.theme ?? "system"}
					onChange={(theme) => updateSettings({ theme })}
				/>
				<p className="text-muted">
					System follows your device and is {systemIsDark ? "Dark" : "Light"} right now.
					This choice is part of your backup.
				</p>
			</SettingsCard>
		</div>
	);
}
