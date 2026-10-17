import { pageMetadata } from "@/lib/pageMetadata";
import { WikiIndex } from "@/comps/wiki/WikiIndex";

export const metadata = pageMetadata({
	title: "Whiteout Survival game data reference", // i18n-ignore
	description:
		"Browse Whiteout Survival game data: buildings, heroes, gear, pets, research, events, VIP and more, with costs, times, power and requirements.", // i18n-ignore
	path: "/wiki",
});

export default function WikiPage() {
	return <WikiIndex />;
}
