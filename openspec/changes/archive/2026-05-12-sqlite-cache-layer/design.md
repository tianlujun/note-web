# SQLite 缓存层技术设计

## Context

### 背景

当前 note-web 后端每次前端请求都直接操作文件系统：
- `/api/files` 每次遍历整个目录树
- `/api/search` 每次读取并解析所有 HTML 文件
- `/api/file/{path}` 每次读取指定文件

当笔记规模达到成百上千个 HTML 文件时，性能将成为严重瓶颈。

### 当前约束

- **笔记来源**：`/root/notes-mvp` 目录下的 HTML 文件
- **同步机制**：Agent 发送 notify → rclone sync → 更新缓存
- **部署环境**：VPS，已有可用 SQLite
- **技术栈**：Python FastAPI + 标准库 sqlite3

### 利益相关方

- Agent（写笔记并触发同步）
- 前端用户（浏览、搜索、查看图谱）
- 部署工程师（需要清晰的部署说明）

---

## Goals / Non-Goals

**Goals:**
- 实现文件树缓存，加载时间 < 100ms
- 实现 FTS5 全文搜索，响应时间 < 200ms
- 实现链接图谱数据存储与查询
- sync-trigger 后自动增量更新缓存
- 支持缓存失效机制

**Non-Goals:**
- 不实现 Markdown 到 HTML 的转换（存量数据用独立脚本处理）
- 不实现笔记编辑功能（只读系统）
- 不实现多用户权限管理
- 不实现实时同步（WebSocket 等）

---

## Decisions

### Decision 1: 使用 SQLite 而非内存缓存

**选择**: SQLite（FTS5 + 关系表）

**理由**:
- 重启后缓存数据保留，无需预热
- FTS5 对全文搜索有原生支持，性能优秀
- 关系表存储链接图谱数据结构清晰
- Python 标准库 `sqlite3`，无需额外部署

**替代方案考虑**:
| 方案 | 优点 | 缺点 |
|------|------|------|
| 纯内存缓存 | 实现简单 | 重启丢失，无持久化 |
| Redis | 性能高，支持更多数据结构 | 需额外部署 |
| PostgreSQL | 功能强大 | 过度设计，部署复杂 |

### Decision 2: SQLite 作为缓存层而非数据源

**选择**: HTML 文件为事实来源，SQLite 为缓存

**理由**:
- 保持 HTML 文件的 truth source 地位
- sync-trigger 时可以全量或增量更新缓存
- 如果缓存损坏，可以完全重建

**数据流**:
```
HTML 文件 (Truth) ──sync-trigger──▶ SQLite (Cache)
                              │
                              ▼
                       FastAPI 查询
```

### Decision 3: 增量更新而非全量重建

**选择**: sync-trigger 时增量更新缓存

**理由**:
- rclone sync 支持增量同步
- 记录上次同步状态，只更新变化的文件
- 减少数据库写入量，提升性能

**实现方式**:
1. 记录 `sync_log` 表中的 last_sync_time
2. 对比文件修改时间 `modified_at`
3. 只更新变化的文件

### Decision 4: 文件内容也缓存到 files 表

**选择**: files 表存储笔记内容

**表设计**:
```sql
CREATE TABLE files (
    path TEXT PRIMARY KEY,           -- 唯一标识
    name TEXT NOT NULL,              -- 显示名称
    type TEXT NOT NULL,              -- 'file' 或 'dir'
    parent_path TEXT,                 -- 父目录路径
    is_dir_index BOOLEAN DEFAULT 0,  -- _index.html 标记
    title TEXT,                      -- HTML <title> 标签提取
    content TEXT,                    -- 完整 HTML 内容
    modified_at REAL,                -- 文件修改时间
    cached_at REAL                   -- 缓存时间戳
);
```

**理由**:
- 所有文件操作都通过 SQLite 完成，无需直接访问文件系统
- API `/api/file/{path}` 返回 `{path, title, content}`，前端直接渲染
- 搜索 snippet 可直接来自缓存，无需再次读取文件

### Decision 5: 移除 /notes/{path} 端点

**选择**: 所有笔记访问通过 `/api/file/{path}`

**理由**:
- 统一通过 API 获取内容，前端控制渲染和链接拦截
- 保持架构一致性：所有数据都从缓存来
- `/notes/{path}` 端点可移除或仅用于静态资源（如图片）

### Decision 6: FTS5 虚拟表实现搜索

**选择**: FTS5 虚拟表存储搜索索引

**表设计**:
```sql
CREATE VIRTUAL TABLE search_index USING fts5(
    path,
    title,
    content
);
```

**理由**:
- FTS5 是 SQLite 全文搜索标准
- 支持短语搜索、布尔搜索
- 与 files 表关联，内容更新自动同步

### Decision 6: 链接图谱分开存储

**选择**: links 表 + nodes 表分离存储

**表设计**:
```sql
CREATE TABLE links (
    id INTEGER PRIMARY KEY,
    source_path TEXT NOT NULL,
    target_path TEXT NOT NULL,
    link_text TEXT,
    link_type TEXT,  -- 'internal' | 'external'
    cached_at REAL
);

CREATE TABLE nodes (
    path TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    modified_at REAL,
    cached_at REAL
);
```

**理由**:
- links 表记录边（关系）
- nodes 表记录节点（页面）
- 支持图谱遍历查询

---

## Risks / Trade-offs

### Risk: 缓存与源文件不一致
**描述**: 如果 rclone sync 失败或中断，缓存可能与源文件不同步

** Mitigation**:
- 记录 sync_log，每次 sync 记录状态
- sync 前标记 `cache_valid = 0`，sync 完成后标记 `cache_valid = 1`
- 提供手动全量重建 API

### Risk: 首次加载慢
**描述**: 数据库首次创建或全量重建时需要扫描所有 HTML 文件

** Mitigation**:
- 后台异步初始化
- 前端显示加载状态
- 缓存完成后才开放服务

### Risk: SQLite 并发写入
**描述**: sync-trigger 触发时可能有多个并发请求

** Mitigation**:
- 使用 `WAL` 模式提高并发性能
- 使用 `BEGIN IMMEDIATE` 事务
- 或使用写入锁串行化

### Trade-off: 搜索精度
**描述**: FTS5 搜索不如专业搜索引擎（如 Elasticsearch）

** Mitigation**:
- 对于个人笔记场景足够
- 后续如需提升可考虑升级到专业搜索引擎

---

## Migration Plan

### Phase 1: 数据库初始化
1. 添加 `database.py` 模块
2. 实现 `init_db()` 函数创建表结构
3. 首次启动时自动初始化

### Phase 2: 文件树缓存
1. 修改 `/api/files` 使用缓存
2. 实现 `build_tree_from_db()` 查询
3. 实现 `update_tree_cache()` 增量更新

### Phase 3: 搜索功能
1. 修改 `/api/search` 使用 FTS5
2. 实现 `rebuild_search_index()` 索引更新
3. 保持 API 返回格式不变

### Phase 4: 链接图谱
1. 实现 HTML 链接解析
2. 添加 `/api/link-index` 数据库查询
3. 实现增量更新逻辑

### Rollback Strategy
- 如果新缓存有问题，可以禁用缓存回退到文件系统直接读取
- 通过环境变量 `USE_CACHE=false` 切换

---

## Open Questions

1. **链接解析规则**: 如何从 HTML 中提取内部链接？（`<a href>` 还是 wiki-style `[[link]]`？）
2. **缓存过期策略**: 如果没有 sync-trigger，缓存是否需要 TTL 过期？
3. **批量更新**: 如果一次 sync 有 100+ 个文件变化，是否需要批量处理？

---

## File Structure

```
backend/app/
├── main.py           # FastAPI 主应用（修改）
├── config.py         # 配置文件（已存在）
├── database.py       # 新增：SQLite 数据库模块
│   ├── init_db()           # 初始化数据库表
│   ├── get_db()             # 数据库连接上下文管理器
│   ├── get_file_tree()      # 获取文件树（缓存）
│   ├── update_tree_cache()  # 更新文件树缓存
│   ├── search()             # 全文搜索
│   ├── get_link_index()     # 获取链接图谱
│   ├── update_link_cache()   # 更新链接缓存
│   └── rebuild_search_index() # 重建搜索索引
└── ...
```

---

## API Changes

### /api/files (修改)
- **Before**: 直接遍历文件系统
- **After**: 从 SQLite files 表查询

### /api/search (修改)
- **Before**: `root.rglob("*.html")` 遍历
- **After**: FTS5 查询

### /api/link-index (修改)
- **Before**: 读取 `link-index.json`
- **After**: 从 SQLite links/nodes 表查询

### /api/sync-trigger (修改)
- **Before**: 只执行 rclone sync
- **After**: rclone sync + 增量更新 SQLite 缓存

### 新增 API

#### POST /api/cache/rebuild
手动触发全量缓存重建（管理接口）

#### GET /api/cache/status
查看缓存状态（文件数、最后同步时间等）
