"use client";

import { useState } from "react";
import { LuPuzzle } from "react-icons/lu";

interface PieceImageProps {
	src: string;
	size: number;
}

export function PieceImage({ src, size }: PieceImageProps) {
	const [failed, setFailed] = useState(false);

	if (!src || failed) {
		return (
			<span
				aria-hidden="true"
				className="text-muted flex items-center justify-center"
				style={{ width: size, height: size }}
			>
				<LuPuzzle size={Math.round(size * 0.6)} />
			</span>
		);
	}

	return (
		<span
			className="flex items-center justify-center"
			style={{ width: size, height: size }}
		>
			<img
				src={src}
				alt=""
				width={size}
				height={size}
				loading="lazy"
				decoding="async"
				className="size-full object-contain"
				onError={() => setFailed(true)}
			/>
		</span>
	);
}
