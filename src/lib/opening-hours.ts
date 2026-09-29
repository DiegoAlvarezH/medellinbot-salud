/**
 * Minimal parser for the most common OpenStreetMap `opening_hours` patterns
 * ("24/7", "Mo-Fr 07:00-19:00; Sa 08:00-12:00", "Mo-Su 00:00-24:00").
 * Anything it cannot understand yields `undefined` instead of guessing.
 */

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const DAY_LABELS: Record<string, string> = {
  Mo: 'Lun',
  Tu: 'Mar',
  We: 'Mié',
  Th: 'Jue',
  Fr: 'Vie',
  Sa: 'Sáb',
  Su: 'Dom',
  PH: 'Festivos',
};
const WEEK_ORDER = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

interface Rule {
  days: Set<string>;
  ranges: Array<[number, number]>;
  closed: boolean;
}

function expandDays(spec: string): Set<string> | null {
  const days = new Set<string>();
  for (const part of spec.split(',')) {
    const token = part.trim();
    if (token === 'PH') continue;
    const range = token.match(/^(Mo|Tu|We|Th|Fr|Sa|Su)-(Mo|Tu|We|Th|Fr|Sa|Su)$/);
    if (range) {
      let i = WEEK_ORDER.indexOf(range[1]);
      const end = WEEK_ORDER.indexOf(range[2]);
      for (let guard = 0; guard < 7; guard += 1) {
        days.add(WEEK_ORDER[i]);
        if (i === end) break;
        i = (i + 1) % 7;
      }
    } else if (/^(Mo|Tu|We|Th|Fr|Sa|Su)$/.test(token)) {
      days.add(token);
    } else {
      return null;
    }
  }
  return days;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function parse(hours: string): Rule[] | null {
  const rules: Rule[] = [];
  for (const raw of hours.split(';')) {
    const rule = raw.trim();
    if (!rule) continue;
    const match = rule.match(/^([A-Za-z,\- ]+?)\s+(off|closed|[\d:,\- ]+)$/);
    if (!match) return null;
    const days = expandDays(match[1].replace(/\s/g, ''));
    if (!days) return null;
    if (/^(off|closed)$/.test(match[2])) {
      rules.push({ days, ranges: [], closed: true });
      continue;
    }
    const ranges: Array<[number, number]> = [];
    for (const span of match[2].split(',')) {
      const times = span.trim().match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
      if (!times) return null;
      ranges.push([toMinutes(times[1]), toMinutes(times[2])]);
    }
    rules.push({ days, ranges, closed: false });
  }
  return rules.length ? rules : null;
}

export function isAlwaysOpen(hours?: string): boolean {
  if (!hours) return false;
  const h = hours.trim();
  return h === '24/7' || /^Mo-Su 00:00-(24:00|23:59)$/.test(h) || /24\s*horas/i.test(h);
}

/** Current weekday and minutes-since-midnight in Medellín, regardless of the viewer's timezone. */
function bogotaNow(date: Date): { day: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const day = DAYS[['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))];
  return { day, minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}

export function isOpenAt(hours: string | undefined, date: Date = new Date()): boolean | undefined {
  if (!hours) return undefined;
  if (isAlwaysOpen(hours)) return true;
  const rules = parse(hours);
  if (!rules) return undefined;
  const { day, minutes } = bogotaNow(date);
  // Later rules override earlier ones for the same day, as in the OSM spec.
  let open = false;
  for (const rule of rules) {
    if (!rule.days.has(day)) continue;
    open = !rule.closed && rule.ranges.some(([start, end]) => (end > start ? minutes >= start && minutes < end : minutes >= start || minutes < end));
  }
  return open;
}

/** Human-readable Spanish rendering of an OSM opening_hours value. */
export function formatHours(hours?: string): string | undefined {
  if (!hours) return undefined;
  if (isAlwaysOpen(hours)) return 'Abierto 24 horas';
  return hours
    .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (d) => DAY_LABELS[d] ?? d)
    .replace(/\b(off|closed)\b/g, 'cerrado')
    .replace(/;\s*/g, ' · ');
}
