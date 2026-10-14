import Link from "next/link";
import { APP_NAME } from "@/data/nav";
import { SettingsCard } from "./SettingsCard";

export function AboutTab() {
	return (
		<div className="max-w-2xl">
			<SettingsCard
				title={APP_NAME}
				description={`Version ${process.env.NEXT_PUBLIC_APP_VERSION}`}
			>
				<p>
					Track your Whiteout Survival progress: buildings, heroes, chief gear, experts,
					pets, troops, research, alliance tech, resources and your planner. Everything is
					stored in this browser, with optional sync to your own cloud storage.
				</p>
				<p>
					<Link href="/wiki" className="text-link font-medium underline">
						Whiteout Survival wiki
					</Link>
				</p>
				<p className="text-muted">
					Not affiliated with or endorsed by Century Games. Whiteout Survival is a
					trademark of Century Games.
				</p>
			</SettingsCard>
		</div>
	);
}
