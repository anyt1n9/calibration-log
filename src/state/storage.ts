import { CONFIDENCE_MAX, CONFIDENCE_MIN, SCHEMA_VERSION, STORAGE_KEY } from '../config/constants'
import type { Outcome, Prediction, StoredData } from '../types'

/**
 * localStorage が消えると全てを失うアプリなので、
 * 読み書きは必ずここを通し、失敗しても画面が落ちないようにする。
 * localStorage は、サイトデータをブロックする設定では触れただけで例外を投げる。
 */

/** 保存済みの文字列を予測の配列にする。形が壊れていれば null（空配列で上書きしないため） */
export function parseStored(raw: string | null): Prediction[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as StoredData
    if (!parsed || !Array.isArray(parsed.predictions)) return null
    return parsed.predictions
  } catch {
    return null
  }
}

export function load(): Prediction[] {
  return parseStored(readSetting(STORAGE_KEY)) ?? []
}

export function save(predictions: Prediction[]): void {
  const data: StoredData = { version: SCHEMA_VERSION, predictions }
  // 容量超過やプライベートモードでも操作は続行させる
  writeSetting(STORAGE_KEY, JSON.stringify(data))
}

export function readSetting(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeSetting(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 保存できなくても画面は動かし続ける
  }
}

export function toExportBlob(predictions: Prediction[]): Blob {
  const data: StoredData = { version: SCHEMA_VERSION, predictions }
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
}

const OUTCOMES: Array<Outcome | null> = ['hit', 'miss', 'void', null]
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const isDateTime = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value))

/** YYYY-MM-DD の形で、かつ実在する日付か（2026-02-30 などを弾く） */
function isDay(value: unknown): value is string {
  if (typeof value !== 'string' || !DAY_PATTERN.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

/**
 * 読み込んだ1件を検証し、通れば欠損を補った予測を返す。
 * 確信度の範囲（仕様 3-2）と判定の値は、画面と集計を壊すので厳しく見る。
 */
function toPrediction(p: Record<string, unknown> | null | undefined): Prediction | null {
  if (!p || typeof p !== 'object') return null
  const { id, statement, confidence, createdAt, resolveAt } = p
  if (typeof id !== 'string' || id === '') return null
  if (typeof statement !== 'string' || statement.trim() === '') return null
  if (
    typeof confidence !== 'number' ||
    !Number.isInteger(confidence) ||
    confidence < CONFIDENCE_MIN ||
    confidence > CONFIDENCE_MAX
  ) {
    return null
  }
  if (!isDateTime(createdAt) || !isDay(resolveAt)) return null

  const outcome = (p.outcome ?? null) as Outcome | null
  if (!OUTCOMES.includes(outcome)) return null

  const postponedCount = p.postponedCount
  return {
    id,
    statement,
    confidence,
    createdAt,
    resolveAt,
    postponedCount:
      typeof postponedCount === 'number' && Number.isInteger(postponedCount) && postponedCount >= 0
        ? postponedCount
        : 0,
    tags: Array.isArray(p.tags) ? p.tags.filter((t): t is string => typeof t === 'string') : [],
    outcome,
    resolvedAt: outcome !== null && isDateTime(p.resolvedAt) ? p.resolvedAt : null,
    note: typeof p.note === 'string' ? p.note : null,
  }
}

export type ImportResult = {
  predictions: Prediction[]
  /** 壊れていた、または id が重複していて読み込まなかった件数 */
  skipped: number
}

/** 読み込んだ JSON を検証する。壊れた1件で全体を失わないよう、通ったものだけ返す */
export function parseImported(text: string): ImportResult {
  const parsed = JSON.parse(text) as { predictions?: unknown }
  if (!parsed || !Array.isArray(parsed.predictions)) {
    throw new Error('predictions の配列が見つかりません')
  }
  const seen = new Set<string>()
  const predictions: Prediction[] = []
  for (const item of parsed.predictions) {
    const prediction = toPrediction(item as Record<string, unknown>)
    // id が重なると、1回の判定で複数の予測が動いてしまう。先に出たほうを残す
    if (!prediction || seen.has(prediction.id)) continue
    seen.add(prediction.id)
    predictions.push(prediction)
  }
  if (predictions.length === 0) throw new Error('読み込める予測がありませんでした')
  return { predictions, skipped: parsed.predictions.length - predictions.length }
}
