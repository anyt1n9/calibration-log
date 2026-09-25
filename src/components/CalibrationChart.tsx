import { BUCKET_EDGES, MIN_RESOLVED_FOR_SHAPE } from '../config/constants'
import type { Bucket } from '../lib/calibration'

/**
 * キャリブレーション曲線。SVGを直接記述する（チャートライブラリは使わない）。
 *
 * 誤差帯を必ず描くこと（仕様 3-4）。
 * 点だけを描くと n=3 の的中率100%が「完璧」に見え、嘘の確信が生まれる。
 * 帯があれば、少ない記録の点は上下に大きく広がり「まだ何も言えない」が伝わる。
 */

const W = 420
const H = 358
const PAD = { left: 46, right: 14, top: 16, bottom: 62 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom

const X_MIN = 50
const X_MAX = 100

const xScale = (confidence: number) =>
  PAD.left + ((confidence - X_MIN) / (X_MAX - X_MIN)) * PLOT_W
const yScale = (rate: number) => PAD.top + PLOT_H - (rate / 100) * PLOT_H

type Props = {
  buckets: Bucket[]
  resolvedCount: number
  /** 直前に判定した予測が属するバケット。自分が動かした点を強調する */
  highlightBucketIndex: number | null
}

export function CalibrationChart({ buckets, resolvedCount, highlightBucketIndex }: Props) {
  const filled = buckets.filter((b) => b.total > 0 && b.rate !== null)
  const linePoints = filled.map((b) => `${xScale(b.meanConfidence)},${yScale(b.rate ?? 0)}`).join(' ')

  return (
    <div className="chart-card">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="キャリブレーション曲線">
        <title>確信度ごとの実際の的中率と、その95%信頼区間</title>

        {/* 横の目盛り */}
        {[0, 25, 50, 75, 100].map((rate) => (
          <g key={rate}>
            <line
              x1={PAD.left}
              y1={yScale(rate)}
              x2={PAD.left + PLOT_W}
              y2={yScale(rate)}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={yScale(rate) + 4}
              textAnchor="end"
              fontSize={11}
              fill="var(--text-faint)"
            >
              {rate}
            </text>
          </g>
        ))}

        {/* 縦の目盛り */}
        {[50, 60, 70, 80, 90, 100].map((confidence) => (
          <g key={confidence}>
            <line
              x1={xScale(confidence)}
              y1={PAD.top}
              x2={xScale(confidence)}
              y2={PAD.top + PLOT_H}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
            <text
              x={xScale(confidence)}
              y={PAD.top + PLOT_H + 17}
              textAnchor="middle"
              fontSize={11}
              fill="var(--text-faint)"
            >
              {confidence}
            </text>
          </g>
        ))}

        {/* 完璧な予測者の線。ここに乗っていれば、言った通りに当てている */}
        <line
          x1={xScale(50)}
          y1={yScale(50)}
          x2={xScale(100)}
          y2={yScale(100)}
          stroke="var(--chart-ideal)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />

        {/* 判定済み件数。バケットごとに軸の下へ */}
        {buckets.map((bucket, i) => (
          <text
            key={`n-${bucket.label}`}
            x={xScale(
              bucket.total > 0
                ? bucket.meanConfidence
                : (BUCKET_EDGES[i].min + BUCKET_EDGES[i].max) / 2,
            )}
            y={PAD.top + PLOT_H + 33}
            textAnchor="middle"
            fontSize={10}
            fill={bucket.total > 0 ? 'var(--text-dim)' : 'var(--text-faint)'}
          >
            {bucket.total > 0 ? `n=${bucket.total}` : '—'}
          </text>
        ))}

        {/* 点をつなぐ線。形を読むための補助なので淡く */}
        {filled.length >= 2 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke="var(--chart-point)"
            strokeWidth={1.25}
            opacity={0.35}
          />
        )}

        {/* 誤差帯と点 */}
        {buckets.map((bucket, i) => {
          if (bucket.total === 0 || bucket.rate === null || !bucket.interval) return null
          const x = xScale(bucket.meanConfidence)
          const yLow = yScale(bucket.interval.low)
          const yHigh = yScale(bucket.interval.high)
          const isHighlighted = highlightBucketIndex === i
          return (
            <g key={bucket.label}>
              <line
                x1={x}
                y1={yHigh}
                x2={x}
                y2={yLow}
                stroke="var(--chart-band)"
                strokeWidth={2.5}
                strokeLinecap="round"
                opacity={0.5}
              />
              <line x1={x - 4} y1={yHigh} x2={x + 4} y2={yHigh} stroke="var(--chart-band)" strokeWidth={1.5} opacity={0.5} />
              <line x1={x - 4} y1={yLow} x2={x + 4} y2={yLow} stroke="var(--chart-band)" strokeWidth={1.5} opacity={0.5} />
              {isHighlighted && (
                <circle
                  className="point-highlight"
                  cx={x}
                  cy={yScale(bucket.rate)}
                  r={5}
                  fill="none"
                  stroke="var(--chart-highlight)"
                  strokeWidth={2}
                />
              )}
              <circle
                cx={x}
                cy={yScale(bucket.rate)}
                r={4.5}
                fill={isHighlighted ? 'var(--chart-highlight)' : 'var(--chart-point)'}
              />
            </g>
          )
        })}

        <text x={PAD.left + PLOT_W / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--text-dim)">
          あなたが言った確信度（%）
        </text>
        <text
          x={-(PAD.top + PLOT_H / 2)}
          y={13}
          transform="rotate(-90)"
          textAnchor="middle"
          fontSize={11}
          fill="var(--text-dim)"
        >
          実際の的中率（%）
        </text>
      </svg>

      <div className="chart-legend">
        <span>
          <i className="legend-swatch" />
          完璧な予測者
        </span>
        <span>
          <i className="legend-dot" />
          あなた
        </span>
        <span>
          <i className="legend-swatch band" />
          95%信頼区間
        </span>
      </div>

      {resolvedCount < MIN_RESOLVED_FOR_SHAPE && (
        <p className="note-shape">
          判定済み{resolvedCount}件。帯が広いのは記録がまだ少ないからで、点の位置には意味がありません。
          形を読めるのは{MIN_RESOLVED_FOR_SHAPE}件を超えたあたりからです。
        </p>
      )}
    </div>
  )
}
