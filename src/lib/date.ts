/** 日付は YYYY-MM-DD の文字列で持ち、比較もその形のまま行う（タイムゾーンで壊れないように） */

export function toDayString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * ISO8601 日時を、端末のタイムゾーンでの YYYY-MM-DD にする。
 * 先頭10文字を切り出すと UTC の日付になり、日本では朝9時前の判定が前日に見える
 */
export function dayOf(isoDateTime: string): string {
  return toDayString(new Date(isoDateTime))
}

export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(day: string, days: number): string {
  const date = parseDay(day)
  date.setDate(date.getDate() + days)
  return toDayString(date)
}

/** b − a を日数で返す。負なら b のほうが過去 */
export function daysBetween(a: string, b: string): number {
  const ms = parseDay(b).getTime() - parseDay(a).getTime()
  return Math.round(ms / 86_400_000)
}

/** 期限までの距離を日本語にする。today を渡すのは開発時に日付を進められるようにするため */
export function describeDeadline(resolveAt: string, today: string): string {
  const diff = daysBetween(today, resolveAt)
  if (diff === 0) return '今日が期限'
  if (diff > 0) return `あと${diff}日`
  if (diff === -1) return '昨日が期限'
  return `${Math.abs(diff)}日前に期限`
}

export function formatDay(day: string): string {
  const date = parseDay(day)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
