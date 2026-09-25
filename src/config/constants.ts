/**
 * 調整用の定数はすべてここに集約する。
 * コンポーネント内に数値を散らさないこと。
 */

export const STORAGE_KEY = 'calibration-log/v1'
export const SCHEMA_VERSION = 1

// --- 確信度の入力（仕様 3-1, 3-2） ---
/** プリセット。スライダーにしない。6択で一度立ち止まらせる */
export const CONFIDENCE_PRESETS = [50, 60, 70, 80, 90, 95]
/** 50未満は入力させない。否定形で書いてもらう */
export const CONFIDENCE_MIN = 50
export const CONFIDENCE_MAX = 99
export const CONFIDENCE_NUDGE = 1

// --- 期限の入力 ---
export const DEADLINE_PRESETS = [
  { label: '1週間後', days: 7 },
  { label: '1か月後', days: 30 },
  { label: '3か月後', days: 90 },
]
export const DEFAULT_DEADLINE_DAYS = 30

// --- 集計（仕様 4, 3-4） ---
/** 5つに留める。細かく割ると各点の n が一桁になり形が読めない */
export const BUCKET_EDGES = [
  { min: 50, max: 59 },
  { min: 60, max: 69 },
  { min: 70, max: 79 },
  { min: 80, max: 89 },
  { min: 90, max: 100 },
]
/** Wilson score interval の z。1.96 = 95%信頼区間 */
export const Z_95 = 1.96
/** 自信過剰度を表示し始める判定件数 */
export const MIN_RESOLVED_FOR_HEADLINE = 10
/** 曲線の「形」を語ってよい判定件数 */
export const MIN_RESOLVED_FOR_SHAPE = 20
/** 常に50%と言い続けた場合の Brier score。基準線として表示する */
export const BRIER_BASELINE = 0.25

// --- 運用 ---
/** これを超えて延期したら警告を出す（先延ばしで判定から逃げるのを可視化） */
export const POSTPONE_WARN_COUNT = 3
export const POSTPONE_DAYS = 7

// --- 演出（仕様 5）。一斉に更新しない ---
export const REVEAL_MS = {
  /** カードが結果の色に変わる */
  mark: 0,
  /** カードが判定待ちの山から抜ける */
  removeCard: 300,
  /** 記録タブにバッジが付く */
  badge: 600,
  /** 曲線上で動いた点が強調される */
  highlight: 900,
  /** 強調を消すまで */
  highlightHold: 2600,
}
