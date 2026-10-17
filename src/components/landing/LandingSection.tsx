import type { ReactNode } from "react";
import { SectionLabel } from "@/comps/ui/SectionLabel";

interface LandingSectionProps {
	id: string;
	label?: string;
	title: string;
	hideTitle?: boolean;
	tinted?: boolean;
	children: ReactNode;
}

export function LandingSection({
	id,
	label,
	title,
	hideTitle = false,
	tinted = false,
	children,
}: LandingSectionProps) {
	const headingId = `${id}-heading`;

	return (
		<section
			id={id}
			aria-labelledby={headingId}
			className={`scroll-mt-4 py-10 lg:py-14 ${tinted ? "bg-tint" : ""}`}
		>
			<div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 lg:px-8">
				<div className={hideTitle ? "sr-only" : "flex flex-col gap-2"}>
					{label && <SectionLabel className="text-muted">{label}</SectionLabel>}
					<h2 id={headingId} className="text-ink text-2xl font-semibold lg:text-3xl">
						{title}
					</h2>
				</div>
				{children}
			</div>
		</section>
	);
}
