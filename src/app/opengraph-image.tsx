import { ImageResponse } from "next/og";

export const alt = "Whiteout Survival Tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const Image = () =>
	new ImageResponse(
		<div
			style={{
				background: "linear-gradient(135deg, #0e2240 0%, #1d5fb0 60%, #7cc4ff 100%)",
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				fontFamily: "sans-serif",
			}}
		>
			<div
				style={{
					color: "white",
					fontSize: 84,
					fontWeight: 800,
					letterSpacing: "-2px",
					lineHeight: 1,
					marginBottom: 20,
				}}
			>
				Whiteout Survival Tracker
			</div>
			<div style={{ color: "rgba(255,255,255,0.85)", fontSize: 34 }}>
				Chiefs, upgrades, research and events in one place
			</div>
		</div>,
		{ ...size }
	);

export default Image;
