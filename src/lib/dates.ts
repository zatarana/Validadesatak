import { differenceInCalendarDays, format, isValid, parseISO, startOfDay } from 'date-fns';

export function getDaysUntil(dateIso: string) {
  const parsedDate = parseISO(dateIso);
  if (!isValid(parsedDate)) return 0;

  return differenceInCalendarDays(startOfDay(parsedDate), startOfDay(new Date()));
}

export function toInputDate(dateIso: string) {
  const parsedDate = parseISO(dateIso);
  if (!isValid(parsedDate)) return '';

  return format(parsedDate, 'yyyy-MM-dd');
}

export function toIsoFromInputDate(inputDate: string) {
  // Meio-dia local evita a validade voltar um dia em navegadores/fusos diferentes.
  return new Date(`${inputDate}T12:00:00`).toISOString();
}

export function formatPtDate(dateIso: string, pattern = 'dd/MM/yy') {
  const parsedDate = parseISO(dateIso);
  if (!isValid(parsedDate)) return '--/--/--';

  return format(parsedDate, pattern);
}

export function getExpirationLabel(days: number) {
  if (days < 0) return `Vencido há ${Math.abs(days)}d`;
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Vence amanhã';
  return `${days}d`;
}
