import { Component, type ReactNode } from 'react'
import { STORAGE_KEY } from '../config/constants'
import { readSetting } from '../state/storage'

/**
 * 描画中の例外で画面が真っ白になるのを防ぐ。
 * 真っ白だと、ユーザーは記録が消えたと思ってブラウザのデータを消しかねない。
 * 保存されている中身はそのまま書き出せるようにしておく。
 */

type State = { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  private downloadRaw = () => {
    const raw = readSetting(STORAGE_KEY) ?? ''
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'calibration-log-backup.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="app">
        <div className="crash">
          <h1>表示中にエラーが起きました</h1>
          <p>
            記録はこのブラウザに残っています。ブラウザのデータは消さずに、まず保存されている中身を書き出してください。
          </p>
          <div className="crash-actions">
            <button type="button" className="primary" onClick={this.downloadRaw}>
              保存されている中身を書き出す
            </button>
            <button type="button" className="icon-button" onClick={() => window.location.reload()}>
              再読み込み
            </button>
          </div>
          <p className="crash-detail">{this.state.error.message}</p>
        </div>
      </div>
    )
  }
}
