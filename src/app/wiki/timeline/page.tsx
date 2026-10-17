import { pageMetadata } from "@/lib/pageMetadata";
import { TimelinePage } from "@/comps/wiki/pages/TimelinePage";

export const metadata = pageMetadata({
	title: "Whiteout Survival server timeline", // i18n-ignore
	description:
		"What unlocks at each Whiteout Survival server age, from the first day of a new server onward. Reference only.", // i18n-ignore
	path: "/wiki/timeline",
});

export default function WikiTimelinePage() {
	return <TimelinePage />;
}
