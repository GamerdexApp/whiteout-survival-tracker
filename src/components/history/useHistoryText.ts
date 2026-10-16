import { useTranslations } from "next-intl";
import type { CoreEventId, EventHistoryEntry } from "@/types/app";
import { formatDecimal, formatNumber, formatShortDate } from "@/lib/format";

const localDate = (day: string) => `${day}T00:00:00`;

export const signedNumber = (value: number) =>
  value > 0 ? `+${formatNumber(value)}` : formatNumber(value);

export const signedPercent = (value: number) =>
  value > 0 ? `+${formatDecimal(value, 1)}` : formatDecimal(value, 1);

export function useHistoryText() {
  const t = useTranslations("history");

  const titleOf = (event: CoreEventId, entry: EventHistoryEntry) =>
    entry.start && entry.end
      ? t("title.dated", {
          event: t(`events.${event}`),
          start: formatShortDate(localDate(entry.start)),
          end: formatShortDate(localDate(entry.end)),
        })
      : t("title.undated", { event: t(`events.${event}`) });

  const endedOf = (entry: EventHistoryEntry) =>
    t("ended", { date: formatShortDate(entry.endedAt) });

  const rankOf = (rank: number | undefined) =>
    rank === undefined ? t("unknown") : formatNumber(rank);

  return { titleOf, endedOf, rankOf };
}
