import Link from "next/link";
import { APP_NAME } from "@/data/nav";

export function BrandMark({ onNavigate }: { onNavigate?: () => void }) {
	return (
		<Link href="/" onClick={onNavigate} className="flex items-center gap-2.5">
			<img
				src="/app-icon.jpg"
				alt=""
				width={44}
				height={44}
				className="block size-11 shrink-0 rounded-lg"
			/>
			<span className="font-brand text-sb-text flex flex-col text-[17px] leading-[1.05]">
				{/* i18n-ignore */}
				<span>Whiteout Survival</span>
				{/* i18n-ignore */}
				<span className="text-sb-muted">Tracker</span>
			</span>
			<span className="sr-only">{APP_NAME}</span>
		</Link>
	);
}
