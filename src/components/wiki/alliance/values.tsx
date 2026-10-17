import { formatDuration } from "@/lib/format";
import { UnknownValue } from "../UnknownValue";

export function TextOrUnknown({ text }: { text: string | undefined }) {
	return text ? <>{text}</> : <UnknownValue />;
}

export function DurationOrUnknown({ seconds }: { seconds: number | undefined }) {
	return seconds === undefined ? <UnknownValue /> : <>{formatDuration(seconds)}</>;
}
