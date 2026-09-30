/**
 * Colombian phone helpers. Since 2021 landlines use the 60X area prefix (604 = Antioquia),
 * but many registries still publish 7-digit numbers and extensions in free text.
 */

function split(raw: string): { digits: string; extension?: string } {
  const [main, ...rest] = raw.split(/\s*(?:ext\.?|extensi[oó]n|ext:)\s*/i);
  // Registries list several numbers in one field: "4125594 - 3498920", "604… / 300…", "… y …".
  const firstNumber = main.split(/\s[-–]\s|[,;/]| y | o /i)[0] ?? main;
  const extension = rest.join(' ').match(/\d+/)?.[0];
  return { digits: firstNumber.replace(/\D/g, '').replace(/^57(?=\d{10}$)/, ''), extension };
}

function normalizeDigits(raw: string): string | null {
  // "+57 604 …" and the pre-2021 "+57 4 …" landline format.
  const digits = raw.length === 12 && raw.startsWith('57') ? raw.slice(2) : raw.length === 10 && raw.startsWith('574') ? `604${raw.slice(3)}` : raw;
  if (digits.length === 7) return `604${digits}`;
  if (digits.length === 8 && digits.startsWith('4')) return `60${digits}`;
  if (digits.length === 10) return digits;
  if (/^(123|106|141|155|122)$/.test(digits) || /^01?8000\d{6}$/.test(digits)) return digits;
  return null;
}

export function formatPhone(raw?: string): string | undefined {
  if (!raw) return undefined;
  const { digits, extension } = split(raw);
  const number = normalizeDigits(digits);
  if (!number) return raw.trim();
  const pretty = number.length === 10 ? `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}` : number;
  return extension ? `${pretty} ext. ${extension}` : pretty;
}

export function telHref(raw?: string): string | undefined {
  if (!raw) return undefined;
  const number = normalizeDigits(split(raw).digits);
  if (!number) return undefined;
  return number.length === 10 ? `tel:+57${number}` : `tel:${number}`;
}
