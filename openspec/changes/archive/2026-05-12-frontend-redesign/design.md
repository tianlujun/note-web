# 前端重建技术设计

## Context

### 背景

note-web 前端由另一 agent 生成，存在以下问题：
- UI 不够美观，缺乏设计一致性
- CSS 架构混乱，修改容易导致其他功能出问题
- 代码质量不高，难以维护

### 约束

- 必须与现有 FastAPI 后端兼容
- 必须支持现有 API 端点
- 登录页为独立 HTML (`login_page.html`)，不在 React SPA 控制内
- 笔记内容通过 `/api/file/{path}` 获取（从 SQLite 缓存）
- 图谱数据通过 `/api/link-index` 获取，API 响应格式为 `{nodes: [...], edges: [...]}`
  - 参考 sqlite-cache-layer 的 `link-graph/spec.md` 定义

### 利益相关方

- 开发者：需要清晰的代码结构和组件划分
- 用户：需要美观、流畅的阅读体验

---

## Goals / Non-Goals

**Goals:**
- 建立现代化的 React + Tailwind + shadcn/ui 技术栈
- 实现朱砂墨设计语言（Linear 简约 + 国风印章点缀）
- 支持深色/浅色主题一键切换
- 重构所有核心组件，确保 CSS 独立不冲突
- 保持 API 兼容性

**Non-Goals:**
- 不实现笔记编辑功能（只读系统）
- 不改变现有 API 契约
- 不实现用户权限系统
- 不实现笔记版本控制

---

## Decisions

### Decision 1: 使用 shadcn/ui 作为组件库

**选择**: shadcn/ui + Radix UI primitives

**理由**:
- shadcn/ui 不是传统组件库，是 copy-paste 的源码
- 每个组件 CSS 独立，不会修改 A 导致 B 坏掉
- 基于 Radix UI，质量有保证
- TypeScript 原生支持
- 可高度定制品牌色

**替代方案考虑**:
| 方案 | 优点 | 缺点 |
|------|------|------|
| 纯 Tailwind 组件 | 无额外依赖 | 需从零开发 |
| Chakra UI | 组件丰富 | 样式耦合深 |
| Ant Design | 组件极丰富 | 样式难以定制 |
| Radix UI | 底层原语 | 需要自己写样式 |

### Decision 2: 使用 Tailwind CSS v4 的 CSS-first 配置

**选择**: Tailwind v4 的 CSS-first 配置方式

**理由**:
- 在 globals.css 中直接定义 design tokens
- 更符合 Tailwind 团队推荐方式
- 与 shadcn/ui 配合良好

**配置示例**:
```css
@theme {
  --color-background: #FAFAF8;
  --color-foreground: #1A1A1A;
  --color-accent: #C53E3E;
  /* ... */
}
```

### Decision 3: Zustand 作为状态管理

**选择**: Zustand v5

**理由**:
- 轻量级，比 Redux 简单太多
- TypeScript 支持好
- 与 React 19 兼容
- 已有经验

### Decision 4: Shadow DOM 隔离笔记内容样式

**选择**: 继续使用 Shadow DOM

**理由**:
- 笔记内容可能包含任意 HTML/CSS
- 需要与主应用样式隔离
- 避免样式冲突

### Decision 5: React Router v7 文件路由

**选择**: React Router v7 文件路由 (`(app)/notes/[...path]/page.tsx`)

**理由**:
- 文件路由更直观
- 与 Next.js App Router 类似
- 适合深层嵌套的笔记路径

### Decision 6: React Flow 作为图谱渲染库

**选择**: @xyflow/react (React Flow)

**理由**:
- React 原生，TypeScript 支持好
- 内置 touch 支持（移动端缩放、拖拽）
- 内置 accessibility（键盘焦点、屏幕阅读器）
- 性能优秀（100-500 节点无压力）
- 与 Dagre 配合实现自动布局

**布局方案**:
- 使用 Dagre 做自动层次布局
- 支持从左到右 (LR) 或从上到下 (TB) 布局

**替代方案考虑**:
| 方案 | 优点 | 缺点 |
|------|------|------|
| Cytoscape.js | Obsidian 插件在用、图算法丰富 | 需 wrapper、学习曲线陡 |
| D3.js Force | 经典方案 | 需大量自定义代码 |
| Vis.js | 上手简单 | 多点触控有 bug |

### Decision 7: 文件树白名单过滤

**选择**: 只显示 `.md` 文件和目录，过滤静态资源

**理由**:
- Obsidian 仓库 95% 是图片（attachments），不需要显示
- 白名单方式更干净，不需要虚拟化
- 最大目录 30 个文件，性能足够

**过滤规则**:
```javascript
// 显示
const SHOW_EXTENSIONS = ['.md'];
const SHOW_DIRS = true;

// 排除
const EXCLUDE_DIRS = ['.obsidian', 'attachments'];
const EXCLUDE_PATTERNS = ['*.png', '*.gif', '*.svg', '*.bin', '.DS_Store'];
```

### Decision 8: 移动端优先设计

**选择**: 所有交互优先考虑移动端体验

**理由**:
- 用户确认会在移动端使用
- 触摸目标最小 44x44px
- 使用 `touch-action: manipulation` 移除双击缩放延迟
- 焦点状态在触摸和键盘模式下都清晰可见

---

## Risks / Trade-offs

### Risk: shadcn/ui 学习曲线
**描述**: 团队（我）不熟悉 shadcn/ui 的使用方式

** Mitigation**: 官文档清晰，组件数量有限（30+），可以快速上手

### Risk: Tailwind v4 新特性
**描述**: Tailwind v4 是新版本，可能有未知问题

** Mitigation**: 使用稳定版本，遵循官方迁移指南

### Risk: 主题切换实现复杂度
**描述**: 深色/浅色主题需要处理好 CSS 变量和组件库的关系

** Mitigation**: 使用 Tailwind 的 dark mode 特性 + CSS 变量

### Trade-off: shadcn/ui 组件定制
**描述**: 深度定制 shadcn/ui 组件样式可能比较繁琐

** Mitigation**: 只使用核心必要组件，其他自定义

---

## Migration Plan

### Phase 1: 项目脚手架
1. 初始化新的 React + Vite + TypeScript 项目
2. 配置 Tailwind CSS v4
3. 安装 shadcn/ui 和 @xyflow/react
4. 配置项目结构

### Phase 2: 基础组件
1. 实现 ThemeProvider 和主题切换（含 prefers-reduced-motion）
2. 创建布局组件 (AppShell, Sidebar)
3. 创建 UI 基础组件
4. 实现移动端基础样式（touch-action, safe-area）

### Phase 3: 核心功能
1. 认证流程 (LoginPage → App)
2. 文件树组件（白名单过滤 .md）
3. TabBar 和 ContentArea（含文字截断）
4. 搜索功能

### Phase 4: 高级功能
1. 图谱视图（React Flow + Dagre 布局）
2. 键盘快捷键
3. 完整移动端适配（响应式布局）

### Rollback Strategy
- 如果新前端有问题，可以回退到旧的静态文件
- API 兼容性保证切换不影响后端

---

## Open Questions

无。所有技术决策已明确。

---

## File Structure

```
frontend/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   └── (app)/
│       ├── layout.tsx
│       ├── page.tsx
│       └── notes/
│           └── [...path]/
│               └── page.tsx
├── components/
│   ├── ui/                    # shadcn/ui 组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── tabs.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── scroll-area.tsx
│   │   └── skeleton.tsx
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
│   ├── utils.ts
│   └── api.ts
├── stores/
│   ├── auth-store.ts
│   ├── tab-store.ts
│   └── theme-store.ts
├── hooks/
│   └── use-keyboard-shortcuts.ts
└── styles/
    └── globals.css
```
