## Context

**现状：**
- `ContentArea` 组件在 `activeTab?.path` 变化时，通过 `api.getFile()` 请求后端获取笔记内容
- 每次切换 tab，无论内容是否已加载，都会发起新的请求
- SSE 自动刷新已实现，收到 refresh 事件时 `window.location.reload()` 刷新整个页面

**问题：**
- 切换已打开的 tab 时，重复请求已加载过的内容
- 无编辑功能，缓存内容是安全的

## Goals / Non-Goals

**Goals:**
- 缓存已加载的笔记内容到内存
- 切换 tab 时直接使用缓存，无网络请求
- SSE refresh 事件清空缓存，确保内容最新

**Non-Goals:**
- 不实现编辑草稿保存（纯展示场景不需要）
- 不实现复杂的缓存淘汰策略（内存占用不会太大）
- 不实现内容持久化到 localStorage（当前 scope）

## Decisions

### Decision 1: 使用 Zustand store 而非 React Query

**选择**：在现有 `tab-store` 中添加 `contentCache` 字段

**理由**：
- 项目已使用 Zustand，无需引入新库
- 简单够用，不需要 React Query 的高级功能（依赖管理、乐观更新等）
- 与 tab 状态管理逻辑自然关联

### Decision 2: 缓存结构

```typescript
interface CachedContent {
  path: string
  title: string
  content: string
  noteDir: string  // 用于图片 src 重写
}

// store 字段
contentCache: Map<string, CachedContent>
```

### Decision 3: ContentArea 缓存逻辑

```
切换到 tab A
    ↓
contentCache.has('A') ?
    ├── 是 → 直接使用缓存，设置 iframe srcdoc
    └── 否 → api.getFile('A') → 存入缓存 → 设置 iframe srcdoc
```

### Decision 4: SSE refresh 时清空缓存

收到 SSE `refresh` 事件时：
- 清空 `contentCache` Map
- 如果当前有激活的 tab，重新请求当前笔记（保持当前体验）

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 内存占用过多 | Map 只存储已打开 tab 的内容，数量有限 |
| 缓存过期 | SSE refresh 清空缓存确保最新 |

## Migration Plan

1. 在 `tab-store.ts` 添加 `contentCache` 字段和 `getCachedContent`, `setCachedContent`, `clearCache` 方法
2. 修改 `ContentArea` 组件，先查缓存再请求
3. 修改 `AppShell` 的 SSE 事件处理，refresh 时清空缓存并重载当前笔记

**回滚**：删除缓存相关代码即可
