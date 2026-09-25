import { useState } from 'react'
import { POSTPONE_DAYS, POSTPONE_WARN_COUNT, REVEAL_MS } from '../config/constants'
import { daysBetween, describeDeadline } from '../lib/date'
import type { Outcome, Prediction } from '../types'

/**
 * 答え合わせは3秒で終わること（仕様 2）。
 * 押した瞬間に全部が更新されてはいけない。カードの色 → 退場 → バッジ、と順に見せる（仕様 5）。
 */

type Props = {
  prediction: Prediction
  today: string
  onResolve: (id: string, outcome: Outcome, note: string | null) => void
  onPostpone: (id: string) => void
}

export function DueCard({ prediction, today, onResolve, onPostpone }: Props) {
  const [marked, setMarked] = useState<Outcome | null>(null)

  const mark = (outcome: Outcome) => {
    if (marked) return
    setMarked(outcome)
    // 色が変わるのを見せてから、状態を更新して山から抜けさせる
    window.setTimeout(() => onResolve(prediction.id, outcome, null), REVEAL_MS.removeCard)
  }

  const overdue = daysBetween(today, prediction.resolveAt) < 0

  return (
    <div className={`due-card ${marked ? `marked-${marked} leaving` : ''}`}>
      <div className="due-statement">{prediction.statement}</div>
      <div className="due-meta">
        <span>{prediction.confidence}% と言った</span>
        <span className={overdue ? 'overdue' : undefined}>
          {describeDeadline(prediction.resolveAt, today)}
        </span>
        {prediction.postponedCount > 0 && (
          <span className={prediction.postponedCount >= POSTPONE_WARN_COUNT ? 'postponed' : undefined}>
            {prediction.postponedCount}回延期
            {prediction.postponedCount >= POSTPONE_WARN_COUNT && ' — 判定から逃げていませんか'}
          </span>
        )}
      </div>

      <div className="due-actions">
        <button type="button" className="verdict-button hit" onClick={() => mark('hit')} disabled={marked !== null}>
          ○ 当たった
        </button>
        <button type="button" className="verdict-button miss" onClick={() => mark('miss')} disabled={marked !== null}>
          ✕ 外れた
        </button>
      </div>
      <div className="subtle-actions">
        <button type="button" className="link-button" onClick={() => mark('void')} disabled={marked !== null}>
          判定できない
        </button>
        <button type="button" className="link-button" onClick={() => onPostpone(prediction.id)} disabled={marked !== null}>
          {POSTPONE_DAYS}日延ばす
        </button>
      </div>
    </div>
  )
}
