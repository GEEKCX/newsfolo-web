# 🌍 NewsFolo - 全球每日新闻摘要

> 实时获取全球热门、科技/AI、金融/美股/港股、风投、国际政治、大宗商品新闻

[![Vercel](https://vercel.com/button)](https://vercel.com)
[![GitHub](https://img.shields.io/github/stars/GEEKCX/newsfolo-web)](https://github.com/GEEKCX/newsfolo-web)

## ✨ 特性

- 📰 **多分类新闻**: 全部、科技/AI、金融/宏观、美股/港股、风投、国际政治、大宗商品
- ⚡ **实时更新**: 服务器端缓存 1 分钟，客户端自动刷新
- 🌐 **权威来源**: BBC、Reuters、NYT 等国际主流媒体
- 📱 **响应式设计**: 完美适配手机和桌面端
- 🔄 **自动刷新**: 可切换自动/手动刷新模式
- 🚀 **无服务器架构**: 部署在 Vercel 边缘网络

## 🚀 快速部署

### 方式 1: Vercel (推荐)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/GEEKCX/newsfolo-web)

1. 点击上方按钮或访问 [Vercel](https://vercel.com/new/clone?repository-url=https://github.com/GEEKCX/newsfolo-web)
2. 使用 GitHub 登录
3. 点击 "Deploy"

### 方式 2: 本地运行

```bash
# 克隆仓库
git clone https://github.com/GEEKCX/newsfolo-web.git
cd newsfolo-web

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开 http://localhost:3000
```

### 方式 3: 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
newsfolo-web/
├── app/
│   ├── api/
│   │   └── news/
│   │       └── route.ts      # 服务器端新闻 API (绕过 CORS)
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 布局组件
│   └── page.tsx              # 主页面
├── lib/
│   └── news.ts               # 新闻数据工具函数
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## 🔧 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: CSS Modules / Vanilla CSS
- **部署**: Vercel
- **数据源**: BBC RSS, Reuters RSS, NYT RSS

## 📡 新闻源

| 来源 | 类型 | 语言 |
|------|------|------|
| BBC World News | RSS | English |
| Reuters Top News | RSS | English |
| NYT Technology | RSS | English |
| NYT Business | RSS | English |

## ⚙️ 配置

### 自动刷新间隔

在 `app/page.tsx` 中修改:

```typescript
const AUTO_REFRESH_INTERVAL = 60 * 1000; // 1 分钟
```

### 服务器缓存时间

在 `app/api/news/route.ts` 中修改:

```typescript
next: { revalidate: 60 } // 缓存 60 秒
```

## 📱 功能说明

### 新闻分类
- 📰 **全部**: 所有最新新闻
- 🤖 **科技/AI**: 人工智能、科技公司动态
- 💹 **金融/宏观**: 股票市场、宏观经济
- 📈 **美股/港股**: 美股、港股行情
- 🚀 **风投**: 创业公司融资、投资动态
- 🌍 **国际政治**: 地缘政治、国际事务
- 🛢️ **大宗商品**: 黄金、原油、能源

### 刷新模式
- 🔄 **手动刷新**: 点击按钮立即获取最新新闻
- ⏱️ **自动刷新**: 默认每 1 分钟自动更新

## 📄 License

MIT License - 欢迎提交 Issue 和 Pull Request！

---

## 📞 联系方式

- GitHub: [@GEEKCX](https://github.com/GEEKCX)
- 问题反馈: [Issues](https://github.com/GEEKCX/newsfolo-web/issues)

---

Made with ❤️ by NewsFolo
