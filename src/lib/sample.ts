import { CONFIDENCE_PRESETS } from '../config/constants'
import { addDays } from './date'
import type { Prediction } from '../types'

/**
 * 開発時にしか使わない。期限が来ないと曲線を確認できないため（仕様 8）。
 * 本番ビルドには import.meta.env.DEV のガードで含まれない。
 */

const STATEMENTS = [
  '今月中に原稿が終わる',
  'この会議は30分で終わる',
  '今週中に先方から返事が来る',
  'あの機能のバグ報告が来る',
  '来週の面談は延期にならない',
  '見積もりは予算内に収まる',
  '週末は雨が降らない',
  '積んでいる本を今月中に読み終える',
  'このリリースで障害は起きない',
  '来月の請求額は先月より減る',
  '朝の走り込みを今週3回続ける',
  '例の採用は月内に決まらない',
  '新しいツールは2週間で使わなくなる',
  '検証にもう一人必要だと言われる',
  'この設計はレビューで一発で通る',
]

/** 実行ごとに結果が変わらないようにする簡易乱数 */
function makeRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

/**
 * 意図的に自信過剰なデータを作る。
 * 確信度が高いほど実際の的中率とのズレを大きくし、曲線が右下に垂れる形にする。
 */
export function makeSamplePredictions(today: string, count = 52): Prediction[] {
  const random = makeRandom(20260920)
  const out: Prediction[] = []

  for (let i = 0; i < count; i += 1) {
    const confidence = CONFIDENCE_PRESETS[Math.floor(random() * CONFIDENCE_PRESETS.length)]
    const drift = ((confidence - 50) / 50) * 22 // 高い確信度ほど大きく外す
    const trueProbability = (confidence - drift) / 100
    const createdOffset = -(20 + Math.floor(random() * 160))
    const resolveOffset = createdOffset + 7 + Math.floor(random() * 30)
    const resolved = resolveOffset <= -1

    out.push({
      id: `sample-${i}`,
      statement: STATEMENTS[i % STATEMENTS.length],
      confidence,
      createdAt: new Date(Date.parse(addDays(today, createdOffset))).toISOString(),
      resolveAt: addDays(today, resolveOffset),
      postponedCount: 0,
      tags: [],
      outcome: resolved ? (random() < 0.08 ? 'void' : random() < trueProbability ? 'hit' : 'miss') : null,
      resolvedAt: resolved ? new Date(Date.parse(addDays(today, resolveOffset))).toISOString() : null,
      note: null,
    })
  }

  // 答え合わせの流れを試せるよう、期限切れの未判定を数件混ぜる
  for (let i = 0; i < 3; i += 1) {
    out.push({
      id: `sample-due-${i}`,
      statement: STATEMENTS[(i + 5) % STATEMENTS.length],
      confidence: CONFIDENCE_PRESETS[(i + 3) % CONFIDENCE_PRESETS.length],
      createdAt: new Date(Date.parse(addDays(today, -40))).toISOString(),
      resolveAt: addDays(today, -i),
      postponedCount: i === 2 ? 3 : 0,
      tags: [],
      outcome: null,
      resolvedAt: null,
      note: null,
    })
  }

  return out
}
