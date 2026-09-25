import { SCHEMA_VERSION, STORAGE_KEY } from '../config/constants'
import type { Prediction, StoredData } from '../types'

/**
 * localStorage が消えると全てを失うアプリなので、
 * 読み書きは必ずここを通し、失敗しても画面が落ちないようにする。
 */

export function load(): Prediction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredData
    if (!parsed || !Array.isArray(parsed.predictions)) return []
    return parsed.predictions
  } catch {
    return []
  }
}

export function save(predictions: Prediction[]): void {
  try {
    const data: StoredData = { version: SCHEMA_VERSION, predictions }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // 容量超過やプライベートモードでも操作は続行させる
  }
}

export function toExportBlob(predictions: Prediction[]): Blob {
  const data: StoredData = { version: SCHEMA_VERSION, predictions }
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
}

/** 読み込んだ JSON を検証する。壊れた1件で全体を失わないよう、通ったものだけ返す */
export function parseImported(text: string): Prediction[] {
  const parsed = JSON.parse(text) as StoredData
  if (!parsed || !Array.isArray(parsed.predictions)) {
    throw new Error('predictions の配列が見つかりません')
  }
  const valid = parsed.predictions.filter(
    (p): p is Prediction =>
      typeof p?.id === 'string' &&
      typeof p?.statement === 'string' &&
      typeof p?.confidence === 'number' &&
      typeof p?.resolveAt === 'string',
  )
  if (valid.length === 0) throw new Error('読み込める予測がありませんでした')
  return valid.map((p) => ({
    ...p,
    postponedCount: p.postponedCount ?? 0,
    tags: Array.isArray(p.tags) ? p.tags : [],
    outcome: p.outcome ?? null,
    resolvedAt: p.resolvedAt ?? null,
    note: p.note ?? null,
  }))
}
