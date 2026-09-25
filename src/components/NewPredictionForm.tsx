import { useState } from 'react'
import {
  CONFIDENCE_MAX,
  CONFIDENCE_MIN,
  CONFIDENCE_NUDGE,
  CONFIDENCE_PRESETS,
  DEADLINE_PRESETS,
  DEFAULT_DEADLINE_DAYS,
} from '../config/constants'
import { addDays, formatDay } from '../lib/date'
import type { Prediction } from '../types'

/**
 * 15秒で終わること（仕様 2）。ここで悩ませたらアプリは死ぬ。
 * 確信度はスライダーにしない。6択で一度立ち止まらせる（仕様 3-1）。
 */

type Props = {
  today: string
  onSubmit: (prediction: Prediction) => void
  onCancel: () => void
}

export function NewPredictionForm({ today, onSubmit, onCancel }: Props) {
  const [statement, setStatement] = useState('')
  const [confidence, setConfidence] = useState(70)
  const [resolveAt, setResolveAt] = useState(addDays(today, DEFAULT_DEADLINE_DAYS))

  const canSubmit = statement.trim().length > 0

  const submit = () => {
    if (!canSubmit) return
    onSubmit({
      id: crypto.randomUUID(),
      statement: statement.trim(),
      confidence,
      createdAt: new Date().toISOString(),
      resolveAt,
      postponedCount: 0,
      tags: [],
      outcome: null,
      resolvedAt: null,
      note: null,
    })
  }

  return (
    <div className="form">
      <textarea
        autoFocus
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        placeholder="今月中に原稿が終わる"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
        }}
      />
      <p className="form-hint">
        起きないと思うことは「〜しない」と否定形で書いてください。確信度は必ず50%以上になります。
      </p>

      <div className="form-label">どれくらい確からしいか</div>
      <div className="confidence-row">
        {CONFIDENCE_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className="preset"
            aria-pressed={confidence === preset}
            onClick={() => setConfidence(preset)}
          >
            {preset}%
          </button>
        ))}
        <button
          type="button"
          className="nudge"
          aria-label="確信度を下げる"
          disabled={confidence <= CONFIDENCE_MIN}
          onClick={() => setConfidence((c) => Math.max(CONFIDENCE_MIN, c - CONFIDENCE_NUDGE))}
        >
          −
        </button>
        <button
          type="button"
          className="nudge"
          aria-label="確信度を上げる"
          disabled={confidence >= CONFIDENCE_MAX}
          onClick={() => setConfidence((c) => Math.min(CONFIDENCE_MAX, c + CONFIDENCE_NUDGE))}
        >
          ＋
        </button>
      </div>
      <p className="confidence-readout">
        {/* 10回あたりで言うと95%が「10回中10回」に丸まり、確実に見えてしまう */}
        <strong>{confidence}%</strong> の確信 ─ 100回同じことを言ったら{confidence}回当たり、
        {100 - confidence}回外れる、という意味です
      </p>

      <div className="form-label">いつ答え合わせするか</div>
      <div className="deadline-row">
        {DEADLINE_PRESETS.map((preset) => {
          const day = addDays(today, preset.days)
          return (
            <button
              key={preset.label}
              type="button"
              className="preset"
              style={{ width: 'auto', padding: '7px 12px' }}
              aria-pressed={resolveAt === day}
              onClick={() => setResolveAt(day)}
            >
              {preset.label}
            </button>
          )
        })}
        <input
          type="date"
          value={resolveAt}
          min={today}
          onChange={(e) => e.target.value && setResolveAt(e.target.value)}
        />
      </div>
      <p className="form-hint">{formatDay(resolveAt)}に判定します</p>

      <div className="form-footer">
        <button type="button" className="primary" disabled={!canSubmit} onClick={submit}>
          記録する
        </button>
        <button type="button" className="link-button" onClick={onCancel}>
          やめる
        </button>
      </div>
      <p className="form-hint" style={{ marginTop: 10 }}>
        記録したあと、予測文と確信度は変更できません。
      </p>
    </div>
  )
}
