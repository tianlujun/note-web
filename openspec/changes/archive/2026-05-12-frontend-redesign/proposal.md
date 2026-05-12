# 前端重建提案 - 朱砂墨 (Cinnabar Ink)

## 1. 概述与愿景

### 项目定位

朱砂墨是一个极简、现代的个人知识库阅读器，融合 Linear 的快捷美学与东方印章艺术的低调优雅。界面克制、留白充裕，朱砂红作为唯一的强调色，如印章般点缀于关键交互处。整体感觉：像一个精心设计的文具，而非一个功能堆砌的软件。

### 核心原则

- **内容为王**：UI 退后，让笔记内容成为视觉焦点
- **极简即美**：删除一切非必要元素
- **响应如风**：Linear 式的即时反馈，无延迟感
- **朱砂点睛**：印章元素仅在关键处出现，不可滥用

---

## 2. 设计语言

### 2.1 色彩系统

#### 深色模式
```
背景色：
- page:     #0A0A0A  (墨)
- sidebar:  #111111  (浓墨)
- card:     #161616  (淡墨)
- hover:    #1F1F1F
- active:   #252525

文字色：
- primary:  #E5E5E5  (白墨)
- secondary:#8A8A8A  (淡墨)
- muted:    #555555

强调色：
- accent:   #C53E3E  (朱砂红)
- accent-light: rgba(197, 62, 62, 0.12)
- accent-hover: #D84F4F

边框：
- border:   #262626
- divider:  #1F1F1F
```

#### 浅色模式
```
背景色：
- page:     #FAFAF8  (宣纸)
- sidebar:  #F0F0EC  (云白)
- card:     #FFFFFF
- hover:    #F5F5F3
- active:   #EFEFED

文字色：
- primary:  #1A1A1A  (浓墨)
- secondary:#6B6B6B
- muted:    #A0A0A0

强调色：
- accent:   #C53E3E  (朱砂红)
- accent-light: rgba(197, 62, 62, 0.08)
- accent-hover: #A83232

边框：
- border:   #E5E5E3
- divider:  #EFEFED
```

### 2.2 字体系统

```css
/* 西文 */
font-family: 'Inter', 'Noto Sans SC', system-ui, sans-serif;

/* 代码 */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

#### 字体层级
- 标题 H1: 28px / 700 weight / -0.02em tracking
- 标题 H2: 22px / 600 weight
- 标题 H3: 18px / 600 weight
- 正文: 15px / 400 weight / 1.6 line-height
- 次要文字: 13px / 400 weight
- 小标签: 11px / 500 weight / uppercase / 0.05em tracking

### 2.3 空间系统

```
基线：4px

间距：
- xs:   4px
- sm:   8px
- md:   16px
- lg:   24px
- xl:   32px
- 2xl:  48px

圆角：
- sm:   4px
- md:   6px   (主要圆角)
- lg:   8px
- full: 9999px (药丸形)
```

### 2.4 动效哲学

```
时长：
- instant: 50ms  (微交互)
- fast:    100ms (hover等)
- normal:  150ms (布局变化)
- slow:    250ms (页面过渡)

缓动：
- ease-out: cubic-bezier(0.16, 1, 0.3, 1)  (Linear采用)
- spring:   cubic-bezier(0.34, 1.56, 0.64, 1) (弹性)

原则：
- 入场：fade + translateY(4px)
- 退出：fade
- Hover：背景色变化 + 轻微位移
- 点击：scale(0.98) + 短暂
```

### 2.5 印章元素

```
印章使用场景（极简）：
1. 侧边栏顶部 logo 区：「墨」字小印章
2. 登录页：右下角装饰印章
3. 空状态：简约印章图形

印章风格：
- 朱砂红色 (#C53E3E)
- 透明度 60-80%
- 尺寸：24px - 32px
- 纯 SVG实现，非图片
```

---

## 3. 布局与结构

### 3.1 整体布局

```
┌──────────────────────────────────────────────────────────────┐
│  Desktop (≥768px)                                           │
├─────────────┬──────────────────────────────────────────────┤
│             │  Tab Bar                                     │
│  Sidebar    ├──────────────────────────────────────────────┤
│  (260px)    │                                              │
│             │  Content Area                                │
│  - Logo      │                                              │
│  - Search    │  (max-width: 720px, centered)               │
│  - File Tree │                                              │
│             │                                              │
└─────────────┴──────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Mobile (<768px)                                           │
├──────────────────────────────────────────────────────────────┤
│  Top Bar (hamburger + title)                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Content Area (full width)                                  │
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Tab Bar (bottom)                                           │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 侧边栏

```
┌─────────────────────────┐
│  [≡] 墨    [sun/moon] │  ← Logo + 主题切换
├─────────────────────────┤
│  🔍 Search...    [/]  │  ← 搜索框
├─────────────────────────┤
│                         │
│  ▾ 02-Projects         │  ← 目录（可折叠）
│    ▸ html-knowledge     │
│    ▸ another-project    │
│                         │
│  ▸ 05-Entities         │
│                         │
│  ▸ 03-Research         │
│                         │
└─────────────────────────┘
```

### 3.3 响应式策略

- **Desktop (≥1024px)**: 侧边栏 260px，内容区居中 max-width 720px
- **Tablet (768-1023px)**: 侧边栏可折叠，折叠后 48px 图标模式
- **Mobile (<768px)**: 侧边栏变为左滑抽屉，Tab Bar 移至底部

---

## 4. 功能规格

### 4.1 认证

| 场景 | 行为 |
|------|------|
| 未登录访问 | 显示登录页，Bearer token 输入 |
| 登录成功 | 设置 cookie + Zustand，跳转 /app |
| Token 过期 | API 返回 401，触发 logout 事件 |
| Logout | 清除 cookie + Zustand，返回登录页 |

### 4.2 文件树

| 场景 | 行为 |
|------|------|
| 首次加载 | 显示加载骨架屏，同时请求 /api/files |
| 目录点击 | 展开/折叠子项，记忆状态 |
| 文件点击 | 在新标签页打开，或聚焦已存在标签 |
| _index.html | 隐藏不显示（目录封面用） |
| 搜索激活 | 文件树被搜索结果替代 |

### 4.3 多标签页

| 场景 | 行为 |
|------|------|
| 打开文件 | 创建新标签，激活 |
| 关闭标签 | 关闭当前，激活相邻标签 |
| Ctrl+W | 关闭当前标签 |
| Ctrl+Tab | 切换到下一标签 |
| 超过 5 标签 | Tab Bar 横向滚动 |
| 空状态 | 显示「从侧边栏选择笔记开始阅读」 |

### 4.4 搜索

| 场景 | 行为 |
|------|------|
| 触发 | 点击搜索图标，或按 / 键 |
| 输入 | 300ms 防抖，请求 /api/search |
| 结果 | 下拉列表，最多 8 条，显示标题 + snippet |
| 点击结果 | 在新标签打开，关闭搜索 |
| ESC | 关闭搜索，清空输入 |

### 4.5 链接图谱

| 场景 | 行为 |
|------|------|
| 入口 | 侧边栏底部图标按钮 |
| 显示 | 全屏模态框，SVG 力导向图 |
| 节点 | 圆形 + 标签，点击跳转 |
| 边 | 曲线，表示链接关系 |
| 关闭 | 点击背景或 ESC |

### 4.6 主题切换

| 场景 | 行为 |
|------|------|
| 点击切换 | 立即切换深/浅模式 |
| 持久化 | 保存到 localStorage |
| 首次访问 | 跟随系统偏好 |

---

## 5. 组件清单

### 5.1 AppShell
- 布局容器：flex row (sidebar + main)
- 管理侧边栏折叠状态
- 管理移动端抽屉状态

### 5.2 Sidebar
- **状态**: 展开 / 折叠(48px) / 抽屉(移动端)
- **子组件**: Logo, ThemeToggle, SearchInput, FileTree

### 5.3 FileTree
- **状态**: 加载中 / 空 / 有数据
- **交互**: 展开/折叠目录，打开文件
- **技术**: react-accessible-treeview

### 5.4 SearchInput
- **状态**: 收起 / 展开 / 加载中 / 有结果
- **交互**: 展开动画，结果下拉，点击跳转

### 5.5 TabBar
- **状态**: 空 / 有标签
- **交互**: 点击切换，× 关闭，横向滚动

### 5.6 ContentArea
- **状态**: 空 / 加载中 / 已加载 / 错误
- **渲染**: Shadow DOM 隔离样式
- **交互**: 链接拦截，内部导航

### 5.7 GraphView
- **状态**: 加载中 / 已渲染 / 空
- **渲染**: SVG 力导向图
- **交互**: 节点点击，缩放拖拽

### 5.8 LoginPage
- **状态**: idle / loading / error
- **元素**: Token 输入框，提交按钮，错误提示，装饰印章

### 5.9 ThemeToggle
- **状态**: light / dark
- **交互**: 点击切换，图标动画过渡

---

## 6. 技术方案

### 6.1 技术栈

```
框架:     React 19 + Vite 8
路由:     React Router v7
状态:     Zustand v5
样式:     Tailwind CSS v4 + CSS Variables
组件:     shadcn/ui (Radix primitives)
图标:     Lucide React
动画:     Tailwind animate + Framer Motion (可选)
类型:     TypeScript
```

### 6.2 项目结构

```
frontend/src/
├── app/
│   ├── layout.tsx           # AppShell
│   ├── page.tsx             # 首页/空状态
│   ├── (auth)/
│   │   └── login/page.tsx
│   └── (app)/
│       ├── layout.tsx       # 认证后的布局
│       ├── page.tsx         # 空白页
│       ├── notes/[...path]/page.tsx  # 笔记阅读
│       └── graph/page.tsx   # 图谱视图
├── components/
│   ├── ui/                 # shadcn/ui 组件
│   ├── sidebar/
│   │   ├── sidebar.tsx
│   │   ├── file-tree.tsx
│   │   └── search-input.tsx
│   ├── tab-bar/
│   │   └── tab-bar.tsx
│   ├── content/
│   │   └── content-area.tsx
│   ├── graph/
│   │   └── graph-view.tsx
│   └── theme-toggle.tsx
├── lib/
│   ├── utils.ts            # cn() 等工具
│   └── api.ts              # API 客户端
├── stores/
│   ├── auth-store.ts
│   ├── tab-store.ts
│   └── theme-store.ts
├── hooks/
│   └── use-keyboard-shortcuts.ts
└── styles/
    └── globals.css
```

### 6.3 API 集成

所有 API 调用通过 `/api/*` 端点，使用 Bearer token 认证：

| 端点 | 用途 |
|------|------|
| GET /api/files | 获取文件树 |
| GET /api/file/{path} | 获取笔记 `{path, title, content}` |
| GET /api/search?q= | 搜索 |
| GET /api/link-index | 图谱数据 |
| GET /api/cache/status | 缓存状态 |
| POST /api/cache/rebuild | 重建缓存 |

### 6.4 样式架构

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* 浅色模式变量 */
    --background: #FAFAF8;
    --foreground: #1A1A1A;
    --accent: #C53E3E;
    /* ... */
  }

  .dark {
    /* 深色模式变量 */
    --background: #0A0A0A;
    --foreground: #E5E5E5;
    --accent: #C53E3E;
    /* ... */
  }
}
```

---

## 7. 部署注意事项

### 7.1 环境变量
```
VITE_API_URL=/api
```

### 7.2 构建输出
- `vite build` 输出到 `backend/app/static/`
- FastAPI 静态文件服务

### 7.3 已知约束
- 笔记内容通过 `/api/file/{path}` 获取（从 SQLite 缓存）
- 登录页为独立 HTML (`login_page.html`)，不受 React SPA 控制
