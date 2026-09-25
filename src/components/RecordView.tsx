import { BRIER_BASELINE, BUCKET_EDGES } from '../config/constants'
import type { Summary } from '../lib/calibration'
import { bucketize } from '../lib/calibration'
import { dayOf, formatDay } from '../lib/date'
import type { Prediction } from '../types'
import { CalibrationChart } from './CalibrationChart'

type Props = {
  predictions: Prediction[]
  summary: Summary
  justResolvedId: string | null
  onExport: () => void
  onImport: (file: File) => void
}

const MARKS: Record<string, { sign: string; className: string }> = {
  hit: { sign: '○', className: 'hit' },
  miss: { sign: '✕', className: 'miss' },
  void: { sign: '–', className: 'void' },
}

export function RecordView({ predictions, summary, justResolvedId, onExport, onImport }: Props) {
  const buckets = bucketize(predictions)

  // 自分が動かした点を探す。判定不能は曲線を動かさないので対象外
  const justResolved = predictions.find((p) => p.id === justResolvedId)
  const highlightBucketIndex =
    justResolved && justResolved.outcome !== 'void'
      ? BUCKET_EDGES.findIndex(
          (edge) => justResolved.confidence >= edge.min && justResolved.confidence <= edge.max,
        )
      : -1

  const history = predictions
    .filter((p) => p.outcome !== null)
    .sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? ''))

  return (
    <div>
      <CalibrationChart
        buckets={buckets}
        resolvedCount={summary.resolved}
        highlightBucketIndex={highlightBucketIndex >= 0 ? highlightBucketIndex : null}
      />

      <div className="stat-row">
        <span>
          判定済み <strong>{summary.resolved}</strong>件
        </span>
        <span>
          的中 <strong>{summary.hits}</strong>件
        </span>
        <span>
          判定不能 <strong>{summary.voided}</strong>件
        </span>
        {summary.brier !== null && (
          <span className="brier" title={`常に50%と言った場合は ${BRIER_BASELINE}`}>
            Brier {summary.brier.toFixed(3)}
          </span>
        )}
      </div>

      <section className="section">
        <h2 className="section-title">
          履歴<span className="section-count">{history.length}件</span>
        </h2>
        {history.length === 0 ? (
          <p className="empty">判定した予測がここに並びます。</p>
        ) : (
          history.map((prediction) => {
            const mark = MARKS[prediction.outcome ?? 'void']
            return (
              <div
                className={`history-item ${prediction.outcome === 'void' ? 'voided' : ''}`}
                key={prediction.id}
              >
                <span className={`mark ${mark.className}`}>{mark.sign}</span>
                <span className="history-confidence">{prediction.confidence}%</span>
                <span className="history-statement">{prediction.statement}</span>
                <span className="history-note">
                  {prediction.resolvedAt ? formatDay(dayOf(prediction.resolvedAt)) : ''}
                </span>
              </div>
            )
          })
        )}
      </section>

      <div className="data-actions">
        <button type="button" className="icon-button" onClick={onExport}>
          JSONで書き出す
        </button>
        <label className="icon-button" style={{ cursor: 'pointer' }}>
          読み込む
          <input
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImport(file)
              e.target.value = ''
            }}
          />
        </label>
      </div>
      <p className="data-note">
        記録はこのブラウザの中だけに保存されます。閲覧データを消すと失われるので、ときどき書き出してください。
      </p>
    </div>
  )
}
