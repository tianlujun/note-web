## Why

当前 tab 切换行为：打开 tab A → 请求 A，打开 tab B → 请求 B，关闭 tab B → 重新请求 A。虽然每次请求时间不长，但在高频切换或网络慢时体验不佳。由于是纯展示场景（无编辑功能），可以缓存已加载的内容避免重复请求。

## What Changes

1. **新增前端内容缓存**
   - 在 Zustand store 中维护 `Map<path, content>` 内存缓存
   - `ContentArea` 先查缓存，有则直接使用，无则请求并存入缓存

2. **SSE 刷新时清空缓存**
   - 当收到 SSE `refresh` 事件时，清空内容缓存
   - 确保下次访问时获取最新内容

3. **Tab 持久化（可选扩展）**
   - 将 tab 列表和内容缓存持久化到 localStorage
   - 重启浏览器后可快速恢复已打开的 tab

## Capabilities

### New Capabilities

- `tab-content-cache`: Tab 内容内存缓存
  - 缓存已加载的笔记内容到内存 Map
  - 切换 tab 时直接读取缓存，无网络请求
  - SSE refresh 事件触发缓存清空

## Impact

### 后端
- 无需修改

### 前端
- 新增 `content-cache` store 或在 `tab-store` 中添加缓存字段
- `ContentArea` 组件增加缓存查询逻辑
- SSE 事件处理增加清空缓存逻辑

### 依赖
- 现有 Zustand store 结构（无新依赖）
