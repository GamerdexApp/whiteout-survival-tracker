const SCREENSHOT_SIZE = { width: 1200, height: 760 };

interface ScreenshotFrameProps {
	/** The file name without the theme and extension, in /landing. */
	name: string;
	alt: string;
	className?: string;
}

/** A window around a screenshot. The light and the dark capture follow the theme of the visitor. */
export function ScreenshotFrame({ name, alt, className = "" }: ScreenshotFrameProps) {
	return (
		<div
			className={`bg-surface border-line overflow-hidden rounded-md border-[1.5px] ${className}`}
		>
			<div aria-hidden="true" className="border-line flex gap-1.5 border-b-[1.5px] px-3 py-2">
				<span className="bg-track size-2 rounded-full" />
				<span className="bg-track size-2 rounded-full" />
				<span className="bg-track size-2 rounded-full" />
			</div>
			<img
				src={`/landing/${name}-light.jpg`}
				alt={alt}
				{...SCREENSHOT_SIZE}
				loading="lazy"
				className="block h-auto w-full dark:hidden"
			/>
			<img
				src={`/landing/${name}-dark.jpg`}
				alt={alt}
				{...SCREENSHOT_SIZE}
				loading="lazy"
				className="hidden h-auto w-full dark:block"
			/>
		</div>
	);
}
