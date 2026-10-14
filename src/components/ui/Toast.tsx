"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { LuX } from "react-icons/lu";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

interface ToastAction {
	label: string;
	onAction: () => void;
}

interface ToastOptions {
	message: string;
	action?: ToastAction;
	durationMs?: number;
}

interface ToastItem extends ToastOptions {
	id: number;
}

const DEFAULT_DURATION_MS = 5_000;
export const UNDO_DURATION_MS = 10_000;

const ToastContext = createContext<((options: ToastOptions) => void) | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const nextIdRef = useRef(0);
	const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());

	const dismiss = (id: number) => {
		clearTimeout(timersRef.current.get(id));
		timersRef.current.delete(id);
		setToasts((current) => current.filter((toast) => toast.id !== id));
	};

	const show = (options: ToastOptions) => {
		const id = nextIdRef.current++;
		setToasts((current) => [...current, { ...options, id }]);
		timersRef.current.set(
			id,
			setTimeout(() => dismiss(id), options.durationMs ?? DEFAULT_DURATION_MS)
		);
	};

	useEffect(() => {
		const timers = timersRef.current;
		return () => timers.forEach((timer) => clearTimeout(timer));
	}, []);

	return (
		<ToastContext.Provider value={show}>
			{children}
			<div
				role="status"
				aria-live="polite"
				className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2"
			>
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className="border-line bg-surface text-ink pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-md border-[1.5px] py-1 pr-1 pl-4"
					>
						<span className="flex-1 py-2">{toast.message}</span>
						{toast.action && (
							<Button
								variant="ghost"
								className="text-link"
								onClick={() => {
									toast.action?.onAction();
									dismiss(toast.id);
								}}
							>
								{toast.action.label}
							</Button>
						)}
						<IconButton
							label="Dismiss"
							className="text-muted hover:bg-tint"
							onClick={() => dismiss(toast.id)}
						>
							<LuX aria-hidden="true" />
						</IconButton>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (context === undefined) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}
