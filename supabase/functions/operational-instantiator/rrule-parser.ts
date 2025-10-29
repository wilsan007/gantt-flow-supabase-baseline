// =====================================================
// Parser RRULE (RFC 5545)
// Génère les dates d'occurrence selon une règle de récurrence
// =====================================================

interface RRuleOptions {
  rrule: string | null;
  start: Date;
  end: Date;
  until: Date | null;
}

/**
 * Expanse une RRULE en liste de dates
 */
export function expandRRule(options: RRuleOptions): Date[] {
  const { rrule, start, end, until } = options;
  let dates: Date[] = [];

  // Pas de RRULE : une seule date (start_date)
  if (!rrule) {
    const startDate = new Date(start);
    if (startDate >= start && startDate <= end) {
      dates = [startDate];
    }
    return dates;
  }

  // Parser simple de RRULE
  if (rrule.startsWith('FREQ=WEEKLY')) {
    dates = expandWeekly(rrule, start, end);
  } else if (rrule.startsWith('FREQ=DAILY')) {
    dates = expandDaily(start, end);
  } else if (rrule.startsWith('FREQ=MONTHLY')) {
    dates = expandMonthly(rrule, start, end);
  } else {
    // Fallback: une seule date
    dates = [start];
  }

  // Appliquer la limite UNTIL
  if (until) {
    dates = dates.filter((d) => d <= until);
  }

  return dates;
}

/**
 * FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
 */
function expandWeekly(rrule: string, start: Date, end: Date): Date[] {
  const byDayMatch = rrule.match(/BYDAY=([A-Z,]+)/);
  const byDays = (byDayMatch?.[1] ?? 'MO').split(',');

  const dayMap: Record<string, number> = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
  };

  const targetDays = new Set(byDays.map((d) => dayMap[d]));
  const dates: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    if (targetDays.has(current.getUTCDay())) {
      dates.push(new Date(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

/**
 * FREQ=DAILY
 */
function expandDaily(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

/**
 * FREQ=MONTHLY;BYMONTHDAY=1,15
 */
function expandMonthly(rrule: string, start: Date, end: Date): Date[] {
  const dates: Date[] = [];

  // Extraire les jours du mois (BYMONTHDAY)
  const byMonthDayMatch = rrule.match(/BYMONTHDAY=([0-9,]+)/);
  const dayOfMonth = start.getUTCDate();
  const daysOfMonth = byMonthDayMatch
    ? byMonthDayMatch[1].split(',').map(Number)
    : [dayOfMonth];

  const current = new Date(start);

  while (current <= end) {
    for (const day of daysOfMonth) {
      const testDate = new Date(
        Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), day)
      );

      if (testDate >= start && testDate <= end) {
        dates.push(new Date(testDate));
      }
    }

    // Passer au mois suivant
    current.setUTCMonth(current.getUTCMonth() + 1);
  }

  // Retrier et dédupliquer
  return Array.from(new Set(dates.map((d) => d.getTime())))
    .map((t) => new Date(t))
    .sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Calcule le numéro de semaine ISO 8601
 */
export function getIsoWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
}
