"use client";

import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { TechFilters } from "@/service/allianceTech";
import { Button } from "@/comps/ui/Button";
import { Flyout } from "@/comps/ui/Flyout";
import { TechFilterFields } from "./TechFilterFields";

interface TechFiltersFlyoutProps {
	open: boolean;
	filters: TechFilters;
	shown: number;
	onChange: (filters: TechFilters) => void;
	onReset: () => void;
	onClose: () => void;
}

export function TechFiltersFlyout({
	open,
	filters,
	shown,
	onChange,
	onReset,
	onClose,
}: TechFiltersFlyoutProps) {
	const t = useTranslations("tech.filters");

	return (
		<Flyout
			open={open}
			onClose={onClose}
			title={t("title")}
			description={t("description")}
			footer={
				<>
					<Button variant="link" onClick={onReset} className="mr-auto">
						{t("reset")}
					</Button>
					<Button variant="primary" onClick={onClose}>
						{t("done", { count: formatNumber(shown) })}
					</Button>
				</>
			}
		>
			<TechFilterFields
				filters={filters}
				onChange={onChange}
				className="flex flex-col gap-4"
			/>
		</Flyout>
	);
}
