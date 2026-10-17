import { formatNumber } from "@/lib/format";
import type { ItemConversion } from "@/data/game/wikiChiefGear";
import { ResourceList } from "../tables/ResourceList";
import { StackTable } from "../tables/StackTable";
import type { StackColumn } from "../tables/StackTable";
import { UnknownValue } from "../UnknownValue";

interface ExchangeRatesProps {
	label: string;
	headers: { exchange: string; from: string; to: string; weeklyLimit: string };
	rates: ItemConversion[];
}

export function ExchangeRates({ label, headers, rates }: ExchangeRatesProps) {
	const columns: StackColumn<ItemConversion>[] = [
		{
			id: "exchange",
			header: headers.exchange,
			width: "minmax(0,1.6fr)",
			render: (rate) => <span className="font-semibold">{rate.name}</span>,
		},
		{
			id: "from",
			header: headers.from,
			width: "minmax(0,1fr)",
			render: (rate) => (
				<ResourceList
					exact
					entries={[{ itemId: rate.fromItemId, amount: rate.fromQuantity }]}
					emptyText=""
				/>
			),
		},
		{
			id: "to",
			header: headers.to,
			width: "minmax(0,1fr)",
			render: (rate) => (
				<ResourceList
					exact
					entries={[{ itemId: rate.toItemId, amount: rate.toQuantity }]}
					emptyText=""
				/>
			),
		},
		{
			id: "weeklyLimit",
			header: headers.weeklyLimit,
			width: "8rem",
			render: (rate) =>
				rate.weeklyLimit === undefined ? <UnknownValue /> : formatNumber(rate.weeklyLimit),
		},
	];

	return <StackTable label={label} columns={columns} rows={rates} rowKey={(rate) => rate.id} />;
}
