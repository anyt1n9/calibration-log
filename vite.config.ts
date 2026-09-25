import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 相対パスで出力する。GitHub Pages はリポジトリ名がURLに入る
  // （/calibration-log/）ため、絶対パスだと資産を読めず真っ白になる。
  // このアプリはルーターを持たない1ページ構成なので './' で足りる。
  base: './',
  server: { port: 5183, strictPort: true },
})
