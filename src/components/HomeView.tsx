import { useState } from 'react'
import type { Summary } from '../lib/calibration'
import { daysBetween, describeDeadline } from '../lib/date'
import type { Outcome, Prediction } from '../types'
import { DueCard } from './DueCard'
import { HeadlineStat } from './HeadlineStat'
import { NewPredictionForm } from './NewPredictionForm'

type Props = {
  predictions: Prediction[]
  summary: Summary
  today: string
  onAdd: (prediction: Prediction) => void
  onResolve: (id: string, outcome: Outcome, note: string | null) => void
  onPostpone: (id: string) => void
}

export function HomeView({ predictions, summary, today, onAdd, onResolve, onPostpone }: Props) {
  const [composing, setComposing] = useState(false)

  const pending = predictions.filter((p) => p.outcome === null)
  // 期限が来たものは古い順に。放置した分ほど上に積み上がる
  const due = pending
    .filter((p) => daysBetween(today, p.resolveAt) <= 0)
    .sort((a, b) => a.resolveAt.localeCompare(b.resolveAt))
  const active = pending
    .filter((p) => daysBetween(today, p.resolveAt) > 0)
    .sort((a, b) => a.resolveAt.localeCompare(b.resolveAt))

  return (
    <div>
      <HeadlineStat summary={summary} />

      {due.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            答え合わせ<span className="section-count">{due.length}件</span>
          </h2>
          {due.map((prediction) => (
            <DueCard
              key={prediction.id}
              prediction={prediction}
              today={today}
              onResolve={onResolve}
              onPostpone={onPostpone}
            />
          ))}
        </section>
      )}

      <section className="section">
        {composing ? (
          <NewPredictionForm
            today={today}
            onSubmit={(prediction) => {
              onAdd(prediction)
              setComposing(false)
            }}
            onCancel={() => setComposing(false)}
          />
        ) : (
          <button type="button" className="new-trigger" onClick={() => setComposing(true)}>
            ＋ 新しい予測
          </button>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">
          進行中<span className="section-count">{active.length}件</span>
        </h2>
        {active.length === 0 ? (
          <p className="empty">
            まだ何も待っていません。これから起きることを1つ書いてみてください。
          </p>
        ) : (
          <div>
            {active.map((prediction) => (
              <div className="active-item" key={prediction.id}>
                <span className="active-statement">{prediction.statement}</span>
                <span className="active-confidence">{prediction.confidence}%</span>
                <span className="active-deadline">{describeDeadline(prediction.resolveAt, today)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
