export const sumOf = (values: number[]) =>
  values.reduce((total, value) => total + value, 0);

export const matchesSearch = (name: string, search: string) =>
  name.toLowerCase().includes(search.trim().toLowerCase());
