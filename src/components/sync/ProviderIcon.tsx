import { FaGithub, FaGoogleDrive } from "react-icons/fa";
import type { SyncProviderId } from "@/lib/sync/providers";

export function ProviderIcon({ provider, size = 20 }: { provider: SyncProviderId; size?: number }) {
	const Icon = provider === "google" ? FaGoogleDrive : FaGithub;
	return (
		<span
			aria-hidden="true"
			className="bg-tint text-primary flex size-10 shrink-0 items-center justify-center rounded-md"
		>
			<Icon size={size} />
		</span>
	);
}
