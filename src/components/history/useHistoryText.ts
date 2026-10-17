import { useTranslations } from "next-intl";
import type { CoreEventId, EventHistoryEntry } from "@/types/app";
import {
  formatCalendarDate,
  formatDecimal,
  formatNumber,
  formatShortDate,
} from "@/lib/format";

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
          start: formatCalendarDate(entry.start),
          end: formatCalendarDate(entry.end),
        })
      : t("title.undated", { event: t(`events.${event}`) });

  const endedOf = (entry: EventHistoryEntry) =>
    t("ended", { date: formatShortDate(entry.endedAt) });

  const rankOf = (rank: number | undefined) =>
    rank === undefined ? t("unknown") : formatNumber(rank);

  return { titleOf, endedOf, rankOf };
}
