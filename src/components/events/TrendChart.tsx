"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";
import { MONTH_IDS } from "@/service/eventsFormat";
import type { TrendMetric, TrendPoint } from "@/service/eventsResults";
import { zoneParts } from "@/service/eventsSchedule";
import type { EventsZone } from "@/service/eventsSchedule";

interface TrendChartProps {
	points: TrendPoint[];
	metric: TrendMetric;
	zone: EventsZone;
	label: string;
}

const DEFAULT_WIDTH = 640;
const NARROW_WIDTH = 500;
const TICK_COUNT = 4;
const MAX_X_LABELS = 7;

export const niceTicks = (min: number, max: number): number[] => {
	if (min === max) return [min];
	const rough = (max - min) / (TICK_COUNT - 1);
	const magnitude = 10 ** Math.floor(Math.log10(rough));
	const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough;
	const first = Math.floor(min / step) * step;
	const ticks: number[] = [];
	for (let value = first; value < max + step; value += step) ticks.push(value);
	return ticks.slice(0, TICK_COUNT + 2);
};

export function TrendChart({ points, metric, zone, label }: TrendChartProps) {
	const t = useTranslations("events");
	const frameRef = useRef<HTMLDivElement>(null);
	const [measured, setMeasured] = useState(DEFAULT_WIDTH);
	const width = measured;
	const height = width < NARROW_WIDTH ? 200 : 240;
	const left = width < NARROW_WIDTH ? 44 : 52;
	const right = 16;
	const top = 24;
	const bottom = 26;

	useEffect(() => {
		const frame = frameRef.current;
		if (!frame) return;
		const observer = new ResizeObserver(([entry]) =>
			setMeasured(Math.max(240, Math.round(entry.contentRect.width)))
		);
		observer.observe(frame);
		return () => observer.disconnect();
	}, []);

	const values = points.map((point) => point.value);
	const ticks = niceTicks(Math.min(...values), Math.max(...values));
	const low = ticks[0];
	const high = ticks[ticks.length - 1];
	const times = points.map((point) => Date.parse(point.runStart));
	const first = times[0];
	const span = times[times.length - 1] - first;

	const x = (index: number) =>
		points.length === 1 || span === 0
			? left + (width - left - right) / 2
			: left + ((times[index] - first) / span) * (width - left - right);
	const y = (value: number) => {
		const ratio = high === low ? 0.5 : (value - low) / (high - low);
		const up = metric === "rank" ? 1 - ratio : ratio;
		return top + (1 - up) * (height - top - bottom);
	};

	const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");
	const area = `${x(0)},${height - bottom} ${line} ${x(points.length - 1)},${height - bottom}`;
	const labelStep = Math.max(1, Math.ceil(points.length / MAX_X_LABELS));
	const monthOf = (runStart: string) =>
		t(`monthsShort.${MONTH_IDS[zoneParts(Date.parse(runStart), zone).month]}`);
	const latest = points[points.length - 1];

	return (
		<div ref={frameRef} className="w-full">
			<svg role="img" aria-label={label} width={width} height={height} className="block">
				{ticks.map((tick) => (
					<g key={tick}>
						<line
							x1={left}
							x2={width - right}
							y1={y(tick)}
							y2={y(tick)}
							className="stroke-line"
							strokeWidth={1}
						/>
						<text
							x={left - 6}
							y={y(tick) + 4}
							textAnchor="end"
							className="fill-muted font-mono"
							fontSize={11}
						>
							{formatNumber(tick)}
						</text>
					</g>
				))}
				<polygon points={area} className="fill-primary" fillOpacity={0.12} />
				<polyline points={line} fill="none" className="stroke-primary" strokeWidth={2.5} />
				{points.map((point, index) => (
					<circle
						key={point.runStart}
						cx={x(index)}
						cy={y(point.value)}
						r={4}
						className="fill-surface stroke-primary"
						strokeWidth={2}
					/>
				))}
				<text
					x={Math.min(x(points.length - 1), width - right - 12)}
					y={y(latest.value) - 10}
					textAnchor="end"
					className="fill-ink font-mono"
					fontSize={12}
					fontWeight={600}
				>
					{formatNumber(latest.value)}
				</text>
				{points.map((point, index) =>
					index % labelStep === 0 || index === points.length - 1 ? (
						<text
							key={`x-${point.runStart}`}
							x={x(index)}
							y={height - 6}
							textAnchor="middle"
							className="fill-muted font-mono"
							fontSize={11}
						>
							{monthOf(point.runStart)}
						</text>
					) : null
				)}
			</svg>
		</div>
	);
}
