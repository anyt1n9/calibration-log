import { useEffect, useMemo, useReducer, useState } from 'react'
import { HomeView } from './components/HomeView'
import { RecordView } from './components/RecordView'
import { REVEAL_MS } from './config/constants'
import { summarize } from './lib/calibration'
import { addDays, toDayString } from './lib/date'
import { makeSamplePredictions } from './lib/sample'
import { initialState, reducer } from './state/reducer'
import { load, parseImported, save, toExportBlob } from './state/storage'
import type { Outcome, Prediction } from './types'

type Tab = 'home' | 'record'
type Theme = 'system' | 'light' | 'dark'

const THEME_KEY = 'calibration-log/theme'

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [tab, setTab] = useState<Tab>('home')
  const [theme, setTheme] = useState<Theme>('system')

  // 起動時の読み込み
  useEffect(() => {
    dispatch({ type: 'hydrate', predictions: load() })
    const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null
    if (storedTheme) setTheme(storedTheme)
  }, [])

  // 変更のたびに保存。読み込みが終わるまでは書かない。
  // ref でこれを判定すると、読み込みと同じコミットで空配列を保存してしまう
  useEffect(() => {
    if (!state.loaded) return
    save(state.predictions)
  }, [state.loaded, state.predictions])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])

  const today = useMemo(() => addDays(toDayString(new Date()), state.dayOffset), [state.dayOffset])
  const summary = useMemo(() => summarize(state.predictions), [state.predictions])

  // 記録タブを開いたら、強調は少し見せてから消す（仕様 5）
  useEffect(() => {
    if (tab !== 'record' || !state.justResolvedId) return
    const timer = window.setTimeout(
      () => dispatch({ type: 'clearHighlight' }),
      REVEAL_MS.highlightHold,
    )
    return () => window.clearTimeout(timer)
  }, [tab, state.justResolvedId])

  const handleResolve = (id: string, outcome: Outcome, note: string | null) => {
    dispatch({ type: 'resolve', id, outcome, note, at: new Date().toISOString() })
    if (outcome !== 'void') {
      window.setTimeout(() => dispatch({ type: 'showBadge' }), REVEAL_MS.badge - REVEAL_MS.removeCard)
    }
  }

  const openTab = (next: Tab) => {
    setTab(next)
    if (next === 'record') dispatch({ type: 'clearBadge' })
  }

  const handleExport = () => {
    const url = URL.createObjectURL(toExportBlob(state.predictions))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `calibration-log-${toDayString(new Date())}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    try {
      const predictions = parseImported(await file.text())
      const ok = window.confirm(
        `${predictions.length}件を読み込みます。いま入っている${state.predictions.length}件は置き換えられます。よろしいですか。`,
      )
      if (ok) dispatch({ type: 'replaceAll', predictions })
    } catch (error) {
      window.alert(`読み込めませんでした: ${(error as Error).message}`)
    }
  }

  const addPrediction = (prediction: Prediction) => dispatch({ type: 'add', prediction })

  return (
    <div className="app">
      <header className="topbar">
        <h1>予測の答え合わせ</h1>
        <button
          type="button"
          className="icon-button"
          onClick={() => {
            const next: Theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
            setTheme(next)
            localStorage.setItem(THEME_KEY, next)
          }}
        >
          {theme === 'system' ? '表示: 自動' : theme === 'light' ? '表示: 明' : '表示: 暗'}
        </button>
      </header>

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className="tab"
          aria-selected={tab === 'home'}
          onClick={() => openTab('home')}
        >
          ホーム
        </button>
        <button
          type="button"
          role="tab"
          className="tab"
          aria-selected={tab === 'record'}
          onClick={() => openTab('record')}
        >
          記録
          {state.recordBadge && <i className="badge-dot" aria-label="更新あり" />}
        </button>
      </div>

      {tab === 'home' ? (
        <HomeView
          predictions={state.predictions}
          summary={summary}
          today={today}
          onAdd={addPrediction}
          onResolve={handleResolve}
          onPostpone={(id) => dispatch({ type: 'postpone', id })}
        />
      ) : (
        <RecordView
          predictions={state.predictions}
          summary={summary}
          justResolvedId={state.justResolvedId}
          onExport={handleExport}
          onImport={handleImport}
        />
      )}

      {import.meta.env.DEV && (
        <div className="devbar">
          <span>開発用</span>
          <button
            type="button"
            onClick={() =>
              dispatch({ type: 'replaceAll', predictions: makeSamplePredictions(today) })
            }
          >
            自信過剰なダミー55件
          </button>
          <button type="button" onClick={() => dispatch({ type: 'replaceAll', predictions: [] })}>
            全消去
          </button>
          <span>
            今日: {today}（{state.dayOffset >= 0 ? '+' : ''}
            {state.dayOffset}日）
          </span>
          <button type="button" onClick={() => dispatch({ type: 'setDayOffset', offset: state.dayOffset + 7 })}>
            7日進める
          </button>
          <button type="button" onClick={() => dispatch({ type: 'setDayOffset', offset: 0 })}>
            today に戻す
          </button>
        </div>
      )}
    </div>
  )
}
