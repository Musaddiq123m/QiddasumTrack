export function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
}

export function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`;
}

export function getDaysDifference(startDateStr: string, endDateStr: string): number {
  const [y1, m1, d1] = startDateStr.split('-').map(Number);
  const [y2, m2, d2] = endDateStr.split('-').map(Number);
  const start = new Date(y1, m1 - 1, d1);
  const end = new Date(y2, m2 - 1, d2);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // inclusive of start and end
}

export function formatDisplayDate(dateStr: string): string {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (dateStr === today) return 'TODAY';
  if (dateStr === yesterday) return 'YESTERDAY';

  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}

export function formatMonthYear(date: Date | string): string {
  let d: Date;
  if (typeof date === 'string') {
    const [y, m] = date.split('-').map(Number);
    d = new Date(y, m - 1, 1);
  } else {
    d = date;
  }
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function getMonthKey(date: Date | string): string {
  if (typeof date === 'string') {
    return date.slice(0, 7); // YYYY-MM
  }
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  // 0 = Sun, 1 = Mon ...
  return new Date(year, month - 1, 1).getDay();
}

export function getPast12Months(currentMonthKey?: string): { key: string; label: string; year: number; month: number }[] {
  const result = [];
  let baseDate = new Date();
  if (currentMonthKey) {
    const [y, m] = currentMonthKey.split('-').map(Number);
    baseDate = new Date(y, m - 1, 1);
  }

  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${padZero(m)}`;
    const label = shortMonths[m - 1];
    result.push({ key, label, year: y, month: m });
  }

  return result;
}

export function getPast7Days(todayDateStr?: string): { date: string; label: string }[] {
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = todayDateStr || getTodayString();

  for (let i = 6; i >= 0; i--) {
    const dStr = addDays(today, -i);
    const [y, m, d] = dStr.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    days.push({
      date: dStr,
      label: dayNames[dayOfWeek],
    });
  }

  return days;
}

export function getPast12Weeks(todayDateStr?: string): { start: string; end: string; label: string }[] {
  const weeks = [];
  const today = todayDateStr || getTodayString();
  const [y, m, d] = today.split('-').map(Number);
  const current = new Date(y, m - 1, d);

  for (let i = 11; i >= 0; i--) {
    const end = new Date(current);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);

    const startStr = `${start.getFullYear()}-${padZero(start.getMonth() + 1)}-${padZero(start.getDate())}`;
    const endStr = `${end.getFullYear()}-${padZero(end.getMonth() + 1)}-${padZero(end.getDate())}`;
    const label = `W${12 - i}`;
    weeks.push({ start: startStr, end: endStr, label });
  }

  return weeks;
}

export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const parts = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return isNegative ? `-Rs. ${parts}` : `Rs. ${parts}`;
}

export function formatBalance(amount: number): string {
  if (amount > 0) {
    return `+${formatCurrency(amount)}`;
  }
  return formatCurrency(amount);
}

export function formatWeekInterval(startStr: string, endStr: string): string {
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y1, m1, d1] = startStr.split('-').map(Number);
  const [y2, m2, d2] = endStr.split('-').map(Number);
  if (m1 === m2 && y1 === y2) {
    return `${shortMonths[m1 - 1]} ${d1} - ${shortMonths[m2 - 1]} ${d2}, ${y2}`;
  }
  if (y1 === y2) {
    return `${shortMonths[m1 - 1]} ${d1} - ${shortMonths[m2 - 1]} ${d2}, ${y2}`;
  }
  return `${shortMonths[m1 - 1]} ${d1}, ${y1} - ${shortMonths[m2 - 1]} ${d2}, ${y2}`;
}

export function formatDuration(totalMinutes: number, roundToHours: boolean = false): string {
  if (!totalMinutes || totalMinutes <= 0) return '0 hrs';
  if (roundToHours) {
    const hrs = Math.round(totalMinutes / 60);
    return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`;
  }
  const hrs = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);

  if (hrs > 0 && mins > 0) {
    return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'} ${mins} minutes`;
  }
  if (hrs > 0 && mins === 0) {
    return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`;
  }
  return `${mins} minutes`;
}

