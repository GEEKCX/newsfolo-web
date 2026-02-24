import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NewsFolo - 全球每日新闻摘要',
  description: '实时获取全球热门、科技、AI、金融、美股、港股、风投、国际政治、大宗商品新闻',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
