// Datas civis do Postgres (date) não representam um instante em UTC.
export const parseDateOnly = (value: string): Date => new Date(`${value.slice(0, 10)}T12:00:00`);
export const formatDateOnly = (value: string): string => parseDateOnly(value).toLocaleDateString('pt-BR');
export const todayLocal = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
