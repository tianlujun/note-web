## Context

当前笔记更新流程：Agent 修改笔记 → rclone sync 到 TOS → `/api/rebuild` 触发增量缓存更新 → 用户需要手动刷新浏览器才能看到最新内容。

**现有架构：**
- 前端：React + Vite SPA，通过 `api.getFile()` 请求后端
- 后端：FastAPI + SQLite，`/api/rebuild` 触发 sync + 增量更新
- 通信：HTTP 纯请求/响应模式，无持久连接

**约束：**
- FastAPI 0.136.1 原生支持 SSE（`StreamingResponse`），无需额外依赖
- 前端使用原生 `EventSource` API，无额外依赖
- 不影响现有 API 行为，只新增端点

## Goals / Non-Goals

**Goals:**
- 实现 SSE 实时通知机制，缓存更新后前端自动刷新
- 最小化侵入式修改，不改变现有核心逻辑
- 支持多前端客户端同时连接

**Non-Goals:**
- 不实现 WebSocket（全双工过于复杂，SSE 足够）
- 不实现用户认证（假设内网部署，/api/events 受现有 auth 保护）
- 不实现消息持久化（客户端重连后获取最新状态即可）

## Decisions

### Decision 1: 使用 SSE 而非 WebSocket

**选择**：SSE (Server-Sent Events)

**理由**：
- 单向通信足够（后端 → 前端），前端只需接收刷新通知
- 原生支持，自动处理重连
- 实现简单，HTTP/1.1 兼容

**替代方案**：
- WebSocket：过于复杂，需要全双工通道
- 长轮询：资源浪费，延迟高

### Decision 2: 全局客户端队列 + 通知函数

**选择**：在 `database.py` 中维护全局 `sse_clients: list` 和 `notify_clients()` 函数

**理由**：
- 简单直接，避免引入消息队列依赖
- 与现有 `log_sync()` 类似，现有架构保持一致
- 在 `incremental_cache_update()` 完成后调用即可

**代码位置**：`backend/app/database.py`

### Decision 3: 前端在 App 初始化时建立 SSE 连接

**选择**：在 `AppShell` 或根组件 `useEffect` 中建立连接

**理由**：
- 单一连接，覆盖所有 tab
- 连接断开时自动重连（`EventSource` 原生支持）
- 收到 `refresh` 事件时，重新请求当前 `activeTab` 内容

### Decision 4: 事件格式为简单文本

**选择**：`data: refresh\n\n`

**理由**：
- 简单够用，无需 JSON 解析
- 可扩展（如未来传递 `changed_paths` 列表）

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| SSE 连接数过多 | 正常情况下用户不会打开大量标签页，风险低 |
| 网络中断导致连接断开 | `EventSource` 自动重连，前端无感知 |
| 通知时客户端已关闭 | `notify_clients()` 捕获异常并清理无效客户端 |
| 多进程环境下客户端列表不共享 | 使用文件或数据库存储客户端状态（避免）或使用单一 uvicorn 进程 |

**[Risk] 多进程环境下 SSE 客户端不共享** → Mitigation: 使用文件描述符同步或确保 uvicorn 以单进程模式运行

## Migration Plan

1. **Phase 1**: 后端新增 `/api/events` 端点 + `notify_clients()` 函数
2. **Phase 2**: 前端新增 SSE 客户端逻辑
3. **Phase 3**: 在 `incremental_cache_update()` 和 `rebuild_cache()` 中调用 `notify_clients()`
4. **验证**: Agent 触发 sync 后，观察前端是否自动刷新

**回滚**：删除 SSE 相关代码即可，不影响现有功能

## Open Questions

1. 是否需要在通知时传递具体变化的路径列表，让前端选择性刷新？
   - 当前方案：前端刷新当前 tab 即可，最简单
   - 未来可扩展：传递 `changed_paths`，前端刷新所有已打开的相关 tab
