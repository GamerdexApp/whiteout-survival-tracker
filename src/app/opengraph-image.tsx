import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Whiteout Survival Tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SCREENSHOT_WIDTH = 1000;
const SCREENSHOT_HEIGHT = Math.round((SCREENSHOT_WIDTH * 760) / 1200);

const Image = async () => {
	const screenshot = await readFile(join(process.cwd(), "public/landing/overview-light.jpg"));
	const source = `data:image/jpeg;base64,${screenshot.toString("base64")}`;

	return new ImageResponse(
		<div
			style={{
				background: "linear-gradient(135deg, #0e2240 0%, #1d5fb0 60%, #7cc4ff 100%)",
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				padding: "44px 64px 0",
				fontFamily: "sans-serif",
				position: "relative",
			}}
		>
			<div
				style={{
					color: "white",
					fontSize: 66,
					fontWeight: 800,
					letterSpacing: "-2px",
					lineHeight: 1,
					marginBottom: 14,
				}}
			>
				Whiteout Survival Tracker
			</div>
			<div style={{ color: "rgba(255,255,255,0.85)", fontSize: 30 }}>
				Chiefs, upgrades, research and events in one place
			</div>
			<img
				src={source}
				alt=""
				width={SCREENSHOT_WIDTH}
				height={SCREENSHOT_HEIGHT}
				style={{
					position: "absolute",
					left: 100,
					top: 215,
					borderRadius: "14px 14px 0 0",
					border: "3px solid rgba(255,255,255,0.55)",
				}}
			/>
		</div>,
		{ ...size }
	);
};

export default Image;
