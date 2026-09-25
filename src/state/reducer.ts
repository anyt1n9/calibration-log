import { POSTPONE_DAYS } from '../config/constants'
import { addDays } from '../lib/date'
import type { Outcome, Prediction } from '../types'

export type State = {
  /**
   * localStorage から読み終えたか。
   * これを見ずに保存すると、初回コミットで空配列を本物のデータに上書きしてしまう。
   */
  loaded: boolean
  predictions: Prediction[]
  /** 直前に判定した予測。曲線上で「自分が動かした点」を強調するために持つ */
  justResolvedId: string | null
  /** 記録タブを見ていないときに付けるバッジ */
  recordBadge: boolean
  /** 開発時のみ、今日の日付を進めるためのオフセット */
  dayOffset: number
}

export type Action =
  | { type: 'hydrate'; predictions: Prediction[] }
  | { type: 'add'; prediction: Prediction }
  | { type: 'resolve'; id: string; outcome: Outcome; note: string | null; at: string }
  | { type: 'postpone'; id: string }
  | { type: 'clearHighlight' }
  | { type: 'showBadge' }
  | { type: 'clearBadge' }
  | { type: 'replaceAll'; predictions: Prediction[] }
  | { type: 'setDayOffset'; offset: number }

export const initialState: State = {
  loaded: false,
  predictions: [],
  justResolvedId: null,
  recordBadge: false,
  dayOffset: 0,
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...state, predictions: action.predictions, loaded: true }

    case 'add':
      return { ...state, predictions: [action.prediction, ...state.predictions] }

    case 'resolve': {
      const predictions = state.predictions.map((p) =>
        p.id === action.id
          ? { ...p, outcome: action.outcome, resolvedAt: action.at, note: action.note }
          : p,
      )
      return {
        ...state,
        predictions,
        // 判定不能は集計に入らないので、曲線は動かない。強調もしない
        justResolvedId: action.outcome === 'void' ? null : action.id,
      }
    }

    case 'postpone':
      return {
        ...state,
        predictions: state.predictions.map((p) =>
          p.id === action.id
            ? {
                ...p,
                resolveAt: addDays(p.resolveAt, POSTPONE_DAYS),
                postponedCount: p.postponedCount + 1,
              }
            : p,
        ),
      }

    case 'showBadge':
      return { ...state, recordBadge: true }

    case 'clearHighlight':
      return { ...state, justResolvedId: null }

    case 'clearBadge':
      return { ...state, recordBadge: false }

    case 'replaceAll':
      return { ...state, predictions: action.predictions, justResolvedId: null }

    case 'setDayOffset':
      return { ...state, dayOffset: action.offset }
  }
}
