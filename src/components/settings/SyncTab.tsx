import { Badge } from "@/comps/ui/Badge";
import { Note } from "@/comps/ui/Note";
import { SettingsCard } from "./SettingsCard";

const providers = ["Google Drive", "Dropbox", "OneDrive", "GitHub"];

export function SyncTab() {
	return (
		<div className="grid items-start gap-4 lg:grid-cols-2">
			<div className="flex flex-col gap-4">
				<Note title="Local storage.">
					Your chiefs are stored in this browser only. They are lost if the browser cache
					is cleared. Export a backup regularly.
				</Note>
				<SettingsCard
					title="Sync across devices"
					description="Keep your chiefs the same on your computer and your phone. Sync is optional and free."
					aside={<Badge tone="locked">Not connected</Badge>}
				>
					<ul className="flex flex-col gap-2">
						{providers.map((provider) => (
							<li
								key={provider}
								className="border-line text-muted flex min-h-11 items-center justify-between gap-3 rounded-md border-[1.5px] px-3"
							>
								{provider}
								<Badge tone="locked">Coming later</Badge>
							</li>
						))}
					</ul>
				</SettingsCard>
			</div>
		</div>
	);
}
