import { useTranslations } from "next-intl";

/** A value the package does not have. It shows as Unknown, never as 0 and never hidden. */
export function UnknownValue() {
	const t = useTranslations("wiki");

	return <span className="text-muted italic">{t("unknown")}</span>;
}
