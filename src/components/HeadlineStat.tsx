import { MIN_RESOLVED_FOR_HEADLINE } from '../config/constants'
import type { Summary } from '../lib/calibration'

/**
 * 唯一大きく出す数字（仕様 3-6）。
 * プラスなら自信過剰、マイナスなら自信不足と言い切る。ぼかさない。
 */

const NEUTRAL_BAND = 3

export function HeadlineStat({ summary }: { summary: Summary }) {
  if (
    summary.resolved < MIN_RESOLVED_FOR_HEADLINE ||
    summary.overconfidence === null ||
    summary.meanConfidence === null ||
    summary.hitRate === null
  ) {
    const remaining = MIN_RESOLVED_FOR_HEADLINE - summary.resolved
    return (
      <div className="headline">
        <p className="headline-locked">
          あと<strong>{remaining}件</strong>判定すると、自分の確信度がどれだけズレているかが出ます。
        </p>
      </div>
    )
  }

  const gap = summary.overconfidence
  const tone = gap > NEUTRAL_BAND ? 'over' : gap < -NEUTRAL_BAND ? 'under' : 'even'
  const verdict =
    tone === 'over' ? '自信過剰' : tone === 'under' ? '自信不足' : '言った通りに当てている'
  const sign = gap > 0 ? '+' : gap < 0 ? '−' : '±'

  return (
    <div className="headline">
      <div className="headline-label">自信過剰度</div>
      <div className={`headline-value ${tone}`}>
        {sign}
        {Math.abs(Math.round(gap))}
        <span style={{ fontSize: '0.45em', fontWeight: 600 }}>pt</span>
      </div>
      <div className="headline-verdict">{verdict}</div>
      <p className="headline-detail">
        あなたは平均 <strong>{Math.round(summary.meanConfidence)}%</strong> と言い、実際は{' '}
        <strong>{Math.round(summary.hitRate)}%</strong> 当てています（判定済み{summary.resolved}件）。
      </p>
    </div>
  )
}
