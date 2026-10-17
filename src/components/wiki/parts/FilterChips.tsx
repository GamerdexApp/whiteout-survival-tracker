interface FilterChipsProps<Value extends string> {
	label: string;
	options: { id: Value; label: string; count?: number }[];
	value: Value;
	onChange: (value: Value) => void;
}

export function FilterChips<Value extends string>({
	label,
	options,
	value,
	onChange,
}: FilterChipsProps<Value>) {
	return (
		<div role="group" aria-label={label} className="flex flex-wrap gap-2">
			{options.map((option) => {
				const active = option.id === value;
				return (
					<button
						key={option.id}
						type="button"
						aria-pressed={active}
						onClick={() => onChange(option.id)}
						className={`flex min-h-11 items-center gap-2 rounded-full border-[1.5px] px-3.5 lg:min-h-9 ${
							active
								? "border-primary bg-tint font-semibold"
								: "border-line bg-surface"
						}`}
					>
						{option.label}
						{option.count !== undefined && (
							<span className="text-muted font-mono text-xs">{option.count}</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
