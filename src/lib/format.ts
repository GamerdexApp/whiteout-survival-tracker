const numberFormat = new Intl.NumberFormat("en-US");

export const formatNumber = (value: number) => numberFormat.format(value);

const compactUnits = [
  { limit: 1_000_000_000, suffix: "B" },
  { limit: 1_000_000, suffix: "M" },
  { limit: 1_000, suffix: "K" },
];

/**
 * Shortens a count for tight rows, for example 4,200,000 becomes 4.2M. Counts below 1,000 stay whole.
 */
export const formatCompact = (value: number) => {
  const unit = compactUnits.find(({ limit }) => value >= limit);
  if (!unit) return formatNumber(value);

  const scaled = value / unit.limit;
  return `${scaled.toFixed(1).replace(/\.0$/, "")}${unit.suffix}`;
};

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3_600;
const SECONDS_PER_DAY = 86_400;

/**
 * Writes a time as its two largest parts, for example 2 days 5 hours becomes 2d 5h.
 */
export const formatDuration = (totalSeconds: number) => {
  const parts = [
    { value: Math.floor(totalSeconds / SECONDS_PER_DAY), unit: "d" },
    {
      value: Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR),
      unit: "h",
    },
    {
      value: Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
      unit: "m",
    },
    { value: totalSeconds % SECONDS_PER_MINUTE, unit: "s" },
  ];
  const firstUsed = parts.findIndex((part) => part.value > 0);
  if (firstUsed === -1) return "0s";

  return parts
    .slice(firstUsed, firstUsed + 2)
    .filter((part) => part.value > 0)
    .map((part) => `${part.value}${part.unit}`)
    .join(" ");
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
export const formatTimeLeft = (seconds: number) =>
  seconds === 0 ? "Ready to finish" : `${formatDuration(seconds)} left`;

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
