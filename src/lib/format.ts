import { formatNumber, translator } from "@/i18n/formatter";

export {
  formatCalendarDate,
  formatCompact,
  formatDateTime,
  formatDecimal,
  formatNumber,
  formatShortDate,
  formatTime,
  todayDate,
} from "@/i18n/formatter";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3_600;
const SECONDS_PER_DAY = 86_400;

/**
 * Writes a time as its two largest parts, for example 2 days 5 hours becomes 2d 5h. The unit
 * letters come from the language catalog.
 */
export const formatDuration = (totalSeconds: number) => {
  const t = translator("common");
  const parts = [
    {
      value: Math.floor(totalSeconds / SECONDS_PER_DAY),
      key: "duration.days" as const,
    },
    {
      value: Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR),
      key: "duration.hours" as const,
    },
    {
      value: Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
      key: "duration.minutes" as const,
    },
    {
      value: totalSeconds % SECONDS_PER_MINUTE,
      key: "duration.seconds" as const,
    },
  ];
  const firstUsed = parts.findIndex((part) => part.value > 0);
  if (firstUsed === -1) return t("duration.zero");

  return parts
    .slice(firstUsed, firstUsed + 2)
    .filter((part) => part.value > 0)
    .map((part) => t(part.key, { value: formatNumber(part.value) }))
    .join(t("duration.separator"));
};

/**
 * The Furnace shows its stage only unless the player asks for full labels, so FC 5-2 reads FC 5.
 */
export const formatFurnaceLevel = (label: string, fullLabels: boolean) =>
  fullLabels ? label : label.replace(/-\d+$/, "");

/**
 * The short Furnace name for tight places such as the chief selector: FC 5 reads FC5 and level 30
 * reads F30. It follows the same stage or full label choice as `formatFurnaceLevel`.
 */
export const formatFurnaceShort = (label: string, fullLabels: boolean) => {
  const level = formatFurnaceLevel(label, fullLabels);
  return level.startsWith("FC ") ? level.replace(" ", "") : `F${level}`;
};

/**
 * The time left on a running upgrade. At zero it says Ready to finish, because an upgrade never
 * finishes by itself.
 */
export const formatTimeLeft = (seconds: number) => {
  const t = translator("common");
  return seconds === 0
    ? t("timeLeft.ready")
    : t("timeLeft.left", { duration: formatDuration(seconds) });
};
