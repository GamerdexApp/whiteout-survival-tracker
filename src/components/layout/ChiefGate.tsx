"use client";

import type { ReactNode } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { ButtonLink } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Skeleton } from "@/comps/ui/Skeleton";
import { PageHeader } from "./PageHeader";

interface ChiefGateProps {
	title: string;
	children: (chief: Playthrough) => ReactNode;
}

/**
 * Pages that read the active chief render through this gate. It shows the loading state while
 * saved data is read and the empty state when there is no chief.
 */
export function ChiefGate({ title, children }: ChiefGateProps) {
	const { activePlaythrough, isLoaded } = usePlaythrough();

	if (!isLoaded) {
		return (
			<>
				<PageHeader title={title} />
				<Skeleton className="h-40" />
			</>
		);
	}

	if (!activePlaythrough) {
		return (
			<>
				<PageHeader title={title} />
				<EmptyState
					title="No chief selected"
					description="Create a chief to start tracking. Everything stays in this browser."
					actions={
						<ButtonLink href="/chiefs?new=1" variant="primary">
							New chief
						</ButtonLink>
					}
				/>
			</>
		);
	}

	return children(activePlaythrough);
}
