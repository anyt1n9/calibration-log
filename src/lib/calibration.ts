import { BUCKET_EDGES, Z_95 } from '../config/constants'
import type { Prediction } from '../types'

/**
 * 統計計算はすべてここに純関数として置く。
 * UIから独立させ、数値で検証できる形にしておくこと。
 * 返す割合はすべて 0-100 のパーセントで統一する。
 */

export type Interval = { center: number; low: number; high: number }

export type Bucket = {
  min: number
  max: number
  label: string
  /** 判定済み件数（判定不能は含まない） */
  total: number
  hits: number
  /** このバケットに入った予測の平均確信度。点の x 座標に使う */
  meanConfidence: number
  /** 実際の的中率。total が 0 なら null */
  rate: number | null
  /** Wilson score interval。total が 0 なら null */
  interval: Interval | null
}

export type Summary = {
  /** 判定済み（hit または miss）の件数 */
  resolved: number
  hits: number
  /** 判定不能の件数。逃げた回数として表示し続ける（仕様 3-3） */
  voided: number
  pending: number
  meanConfidence: number | null
  hitRate: number | null
  /** 平均確信度 − 的中率。プラスなら自信過剰 */
  overconfidence: number | null
  brier: number | null
}

/** 判定済み（集計対象）だけを取り出す。判定不能は除外する */
export function scored(predictions: Prediction[]): Prediction[] {
  return predictions.filter((p) => p.outcome === 'hit' || p.outcome === 'miss')
}

/**
 * Wilson score interval。
 * n が小さいときに的中率100%が「完璧」に見えてしまうのを防ぐための帯（仕様 3-4）。
 * 単純な正規近似だと n=3 で幅が0になり嘘をつくので、こちらを使う。
 */
export function wilsonInterval(hits: number, total: number, z: number = Z_95): Interval | null {
  if (total <= 0) return null
  const x = Math.min(Math.max(hits, 0), total)
  const n = total
  const z2 = z * z
  const denom = n + z2
  const center = (x + z2 / 2) / denom
  const half = (z / denom) * Math.sqrt((x * (n - x)) / n + z2 / 4)
  return {
    center: center * 100,
    low: Math.max(0, center - half) * 100,
    high: Math.min(1, center + half) * 100,
  }
}

export function bucketize(predictions: Prediction[]): Bucket[] {
  const target = scored(predictions)
  return BUCKET_EDGES.map((edge) => {
    const inBucket = target.filter((p) => p.confidence >= edge.min && p.confidence <= edge.max)
    const total = inBucket.length
    const hits = inBucket.filter((p) => p.outcome === 'hit').length
    const meanConfidence =
      total > 0
        ? inBucket.reduce((sum, p) => sum + p.confidence, 0) / total
        : (edge.min + edge.max) / 2
    return {
      min: edge.min,
      max: edge.max,
      label: `${edge.min}-${edge.max}`,
      total,
      hits,
      meanConfidence,
      rate: total > 0 ? (hits / total) * 100 : null,
      interval: wilsonInterval(hits, total),
    }
  })
}

/**
 * Brier score。0 が完璧、0.25 が常に50%と言った場合。
 * 主役にはしない（仕様 3-5）。上げるゲームになると測定が壊れる。
 */
export function brierScore(predictions: Prediction[]): number | null {
  const target = scored(predictions)
  if (target.length === 0) return null
  const sum = target.reduce((acc, p) => {
    const forecast = p.confidence / 100
    const actual = p.outcome === 'hit' ? 1 : 0
    return acc + (forecast - actual) ** 2
  }, 0)
  return sum / target.length
}

/** 平均確信度 − 的中率。このアプリで唯一大きく出す数字（仕様 3-6） */
export function overconfidence(predictions: Prediction[]): number | null {
  const target = scored(predictions)
  if (target.length === 0) return null
  const meanConfidence = target.reduce((s, p) => s + p.confidence, 0) / target.length
  const hitRate = (target.filter((p) => p.outcome === 'hit').length / target.length) * 100
  return meanConfidence - hitRate
}

export function summarize(predictions: Prediction[]): Summary {
  const target = scored(predictions)
  const hits = target.filter((p) => p.outcome === 'hit').length
  const meanConfidence =
    target.length > 0 ? target.reduce((s, p) => s + p.confidence, 0) / target.length : null
  const hitRate = target.length > 0 ? (hits / target.length) * 100 : null
  return {
    resolved: target.length,
    hits,
    voided: predictions.filter((p) => p.outcome === 'void').length,
    pending: predictions.filter((p) => p.outcome === null).length,
    meanConfidence,
    hitRate,
    overconfidence:
      meanConfidence !== null && hitRate !== null ? meanConfidence - hitRate : null,
    brier: brierScore(predictions),
  }
}
