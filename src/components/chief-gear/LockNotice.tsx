import { useTranslations } from "next-intl";
import type { Playthrough } from "@/types/app";
import type { LadderKind } from "@/service/chiefGear";
import { lockRequirementsOf } from "@/service/chiefGear";

export function LockNotice({ chief, kind }: { chief: Playthrough; kind: LadderKind }) {
	const t = useTranslations("chiefGear.lock");
	const requirements = lockRequirementsOf(chief, kind);
	if (requirements.length === 0) return null;
	return (
		<div className="text-muted flex flex-col gap-0.5">
			<p className="font-semibold">{t("title")}</p>
			<ul>
				{requirements.map((requirement) => (
					<li key={requirement}>{requirement}</li>
				))}
			</ul>
		</div>
	);
}
