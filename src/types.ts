export type Outcome = 'hit' | 'miss' | 'void'

export type Prediction = {
  id: string
  /** 予測文。作成後は変更不可（仕様 3-7） */
  statement: string
  /** 50-99 の整数。作成後は変更不可（仕様 3-1, 3-2） */
  confidence: number
  /** ISO8601 日時 */
  createdAt: string
  /** YYYY-MM-DD。延期のみ可 */
  resolveAt: string
  postponedCount: number
  /** フェーズ1では保存のみ。絞り込みは作らない */
  tags: string[]
  outcome: Outcome | null
  resolvedAt: string | null
  note: string | null
}

export type StoredData = {
  version: number
  predictions: Prediction[]
}
