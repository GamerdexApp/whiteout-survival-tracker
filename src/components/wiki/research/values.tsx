import { formatDuration, formatNumber } from "@/lib/format";
import { UnknownValue } from "../UnknownValue";

export function BonusText({ text }: { text: string }) {
	return text ? <>{text}</> : <UnknownValue />;
}

/** A missing time shows Unknown. A time of 0 is a real instant upgrade and shows as 0s. */
export function TimeText({ seconds }: { seconds: number | undefined }) {
	return seconds === undefined ? <UnknownValue /> : <>{formatDuration(seconds)}</>;
}

export function PowerText({ power }: { power: number }) {
	return power > 0 ? <>{formatNumber(power)}</> : <UnknownValue />;
}
