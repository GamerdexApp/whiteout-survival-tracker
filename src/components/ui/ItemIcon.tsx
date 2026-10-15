interface ItemIconProps {
	src?: string;
	size?: number;
	className?: string;
}

/**
 * Some items have no image in the package. They get a plain tinted square, so a row never asks
 * the browser for an empty address.
 */
export function ItemIcon({ src, size = 32, className = "" }: ItemIconProps) {
	if (!src) {
		return (
			<span
				aria-hidden="true"
				style={{ width: size, height: size }}
				className={`bg-track shrink-0 rounded-md ${className}`}
			/>
		);
	}

	return (
		<img
			src={src}
			alt=""
			width={size}
			height={size}
			style={{ width: size, height: size }}
			className={`shrink-0 rounded-md ${className}`}
		/>
	);
}
