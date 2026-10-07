import { useState } from 'react'
import { INSTALL_HINT_KEY } from '../config/constants'
import { readSetting, writeSetting } from '../state/storage'

/**
 * Safari は、7日間操作のなかったサイトの localStorage を消すことがある。
 * 期限が数週間先の予測を置いて開かずにいるのが普通の使い方なので、記録ごと消えかねない。
 * ホーム画面（Mac は Dock）から開くアプリはこの削除の対象外になるため、そちらを案内する。
 */

type Platform = 'ios' | 'mac-safari'

function detectPlatform(): Platform | null {
  // すでにホーム画面・Dock から開いているなら案内は要らない
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  if (standalone) return null

  const ua = navigator.userAgent
  const touchMac = ua.includes('Macintosh') && navigator.maxTouchPoints > 1 // iPadOS は Mac を名乗る
  if (/iPhone|iPad|iPod/.test(ua) || touchMac) return 'ios'
  if (ua.includes('Macintosh') && ua.includes('Safari') && !/Chrome|Chromium|Edg|Firefox|OPR/.test(ua)) {
    return 'mac-safari'
  }
  return null
}

export function InstallHint({ hasRecords }: { hasRecords: boolean }) {
  const [platform] = useState(detectPlatform)
  const [dismissed, setDismissed] = useState(() => readSetting(INSTALL_HINT_KEY) === '1')

  if (!platform || dismissed) return null

  return (
    <aside className="install-hint">
      <p>
        {platform === 'ios' ? 'iPhone・iPad' : 'Mac'} の Safari は、7日間開かなかったサイトの記録を消すことがあります。
        {platform === 'ios' ? (
          <>
            共有ボタンから<strong>「ホーム画面に追加」</strong>して、そこから開いてください。
          </>
        ) : (
          <>
            メニューの「ファイル」から<strong>「Dock に追加」</strong>して、そこから開いてください。
          </>
        )}
        そちらから開けば、この削除は起きません。
      </p>
      {hasRecords && (
        <p>
          追加したアプリには、いまの記録が引き継がれないことがあります。先に記録タブで書き出し、追加したアプリで読み込んでください。
        </p>
      )}
      <button
        type="button"
        className="link-button"
        onClick={() => {
          writeSetting(INSTALL_HINT_KEY, '1')
          setDismissed(true)
        }}
      >
        閉じる
      </button>
    </aside>
  )
}
