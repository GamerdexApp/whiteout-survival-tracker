interface LadderRow {
  statTotalPercent: number;
  powerTotal: number;
}

export interface LadderGroupSummary {
  key: string;
  rowCount: number;
  firstStatPercent: number;
  lastStatPercent: number;
  lastPower: number;
}

/** Groups rows in package order. A group opens at the first row that has its key. */
export const summarizeLadder = <Row extends LadderRow>(
  rows: Row[],
  keyOf: (row: Row) => string,
): LadderGroupSummary[] => {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = keyOf(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return [...groups].map(([key, groupRows]) => ({
    key,
    rowCount: groupRows.length,
    firstStatPercent: groupRows[0].statTotalPercent,
    lastStatPercent: groupRows[groupRows.length - 1].statTotalPercent,
    lastPower: groupRows[groupRows.length - 1].powerTotal,
  }));
};

export const matchesLadderSearch = (texts: string[], search: string) => {
  const needle = search.trim().toLowerCase();
  return texts.some((text) => text.toLowerCase().includes(needle));
};
