## Why

当前笔记更新流程依赖 Agent 修改笔记后用户在浏览器手动刷新页面才能看到最新内容。这种方式体验不佳，且容易遗漏更新。

## What Changes

1. **新增 SSE 事件端点** (`GET /api/events`)
   - 前端建立 SSE 连接，后端维护活跃客户端列表
   - 当 sync + 增量缓存更新完成后，后端主动推送 `refresh` 事件

2. **前端 SSE 客户端集成**
   - 在 App 初始化时建立 SSE 连接
   - 收到 `refresh` 事件后，自动重新请求当前 tab 的笔记内容
   - 连接断开时自动重连

3. **后端通知机制**
   - 在 `incremental_cache_update()` 和 `rebuild_cache()` 完成后触发 `notify_clients()`
   - 确保每次缓存更新都能通知到所有活跃前端客户端

## Capabilities

### New Capabilities

- `sse-events`: Server-Sent Events 实时通知机制
  - 后端维护 SSE 客户端连接池
  - 缓存更新完成后推送 refresh 事件
  - 前端订阅并处理 refresh 事件

## Impact

### 后端
- 新增 `GET /api/events` 端点
- 新增 `notify_clients()` 函数
- 在 `database.py` 的缓存更新函数中调用 `notify_clients()`

### 前端
- 新增 SSE 客户端 hook 或在现有代码中集成
- 接收 refresh 事件后触发 `api.getFile()` 重新加载当前笔记
- 需要处理连接断开重连逻辑

### 依赖
- 后端: `sse-starlette` 或 FastAPI 原生 SSE 支持
- 前端: 原生 `EventSource` API (无额外依赖)
