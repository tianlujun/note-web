# SQLite 缓存层架构提案

## 1. 背景与问题

### 1.1 当前架构

```
TOS (云端) ──rclone sync──▶ /root/notes-mvp (HTML文件)
                                    │
                                    ▼
                             ┌─────────────┐
                             │   FastAPI   │
                             │  (无缓存)   │
                             └─────────────┘
                                    │
                              每次请求都
                              操作文件系统
```

### 1.2 当前问题

| 操作 | 问题 |
|------|------|
| `/api/files` | 每次遍历整个目录树 |
| `/api/search` | 每次读取并解析所有 HTML 文件 |
| `/api/file/{path}` | 每次读取指定文件 |

**性能瓶颈**：后端完全没有缓存机制，每次前端请求都直接操作文件系统。

---

## 2. 使用场景

### 2.1 笔记来源与管理

- **笔记位置**：`/home/tianlj/obsidian`
- **笔记格式**：HTML（Agent 直接写 HTML 笔记）
- **存量 Markdown**：届时用独立脚本处理，不属于本项目范围

### 2.2 目录结构（Obsidian Schema）

```
obsidian/                          # 根目录
├── 00-Scheme/                     # 第一层：大分类
│   └── [project]/                # 第二层：具体项目
│       └── attachments/          # 第三层：静态资源（图片等）
├── 01-Inbox/
├── 02-Projects/
├── 03-Research/
├── 04-Learning/
└── 05-Entities/

最大深度：3 层（不含根）
```

### 2.3 同步机制

- **触发方式**：Agent 写完笔记后发送 notify
- **执行命令**：`rclone sync tos:tianlujun-default/notes-mvp /root/notes-mvp`
- **同步频率**：每天可能多次（非定时任务）

### 2.4 预期规模

- **当前**：146 个 Markdown 文件（存量，单独处理）
- **目标**：成百上千个 HTML 文件

---

## 3. 核心需求

### 3.1 功能需求

1. **文件树浏览** - 快速展示目录结构
2. **全文搜索** - 支持关键词搜索和 snippet 展示
3. **链接图谱** - 展示笔记间的链接关系
4. **多标签浏览** - 同时打开多个笔记

### 3.2 性能需求

- 文件树加载 < 100ms
- 搜索响应 < 200ms
- 笔记加载 < 50ms

---

## 4. 架构提案

### 4.1 方案：SQLite 缓存层（完整缓存）

```
┌─────────────────────────────────────────────────────────────┐
│                        工作流                                │
└─────────────────────────────────────────────────────────────┘

  ① Agent 写 HTML 笔记
           │
           ▼
  ② 同步到 TOS
           │
           ▼
  ③ 向服务器发送 notify
           │
           ▼
  ④ 服务器执行 rclone sync 拉取 TOS
           │
           ▼
  ⑤ 服务器更新 SQLite 缓存（包含文件内容）
           │
           ▼
  ⑥ 前端通过 API 获取笔记内容并渲染

┌─────────────────────────────────────────────────────────────┐
│                        架构图                                │
└─────────────────────────────────────────────────────────────┘

     Agent                              note-web Server
       │                                      │
       │  ① 写 HTML 笔记                       │
       │────────────────────────▶              │
       │  ② 同步到 TOS                        │
       │                                      │
       │  ③ notify ─────────────────────────▶│
       │                                      │
       │                        ④ rclone sync │
       │                         TOS ──▶ /root/notes-mvp
       │                                      │
       │                        ⑤ 更新缓存   │
       │                         SQLite ◀─────┤
       │                         (含 content) │
       │                                      │
       │  ⑥ API 请求 ←───────────────▶ ⑥ │
       │   /api/file/{path}                  │
       │◀───────────────────────────────────│
       │     返回 {path, title, content}     │
```

### 4.2 API 变更

**移除**: `/notes/{path}` 端点（不再直接服务 HTML 文件）

**修改**: `/api/file/{path}` 端点

```python
# 旧实现：只读文件获取 title
@app.get("/api/file/{path:path}")
def api_file(path: str):
    content = file_path.read_text(encoding="utf-8")
    title = extract_title(content)
    return JSONResponse({"path": path, "title": title})

# 新实现：从缓存返回完整内容
@app.get("/api/file/{path:path}")
def api_file(path: str):
    with get_db() as db:
        row = db.execute(
            "SELECT path, title, content FROM files WHERE path = ?",
            (path,)
        ).fetchone()
    if not row:
        raise HTTPException(404, "File not found")
    return JSONResponse({
        "path": row["path"],
        "title": row["title"],
        "content": row["content"]
    })
```

### 4.2 SQLite 表结构设计

```sql
-- 文件缓存（包含内容）
CREATE TABLE files (
    path TEXT PRIMARY KEY,           -- 文件路径
    name TEXT NOT NULL,              -- 文件/目录名
    type TEXT NOT NULL,              -- 'file' 或 'dir'
    parent_path TEXT,                -- 父目录路径
    is_dir_index BOOLEAN DEFAULT 0,  -- 是否是目录索引 (_index.html)
    title TEXT,                      -- HTML <title> 标签
    content TEXT,                    -- 完整 HTML 内容
    modified_at REAL,                -- 文件修改时间戳
    cached_at REAL                   -- 缓存时间戳
);

-- 全文搜索索引 (FTS5)
CREATE VIRTUAL TABLE search_index USING fts5(
    path,
    title,
    content
);

-- 链接图谱数据
CREATE TABLE links (
    id INTEGER PRIMARY KEY,
    source_path TEXT NOT NULL,       -- 源文件
    target_path TEXT NOT NULL,       -- 目标文件
    link_text TEXT,                  -- 链接文本
    link_type TEXT,                  -- 'internal' | 'external'
    cached_at REAL
);

-- 图谱节点
CREATE TABLE nodes (
    path TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    modified_at REAL,
    cached_at REAL
);

-- 同步记录
CREATE TABLE sync_log (
    id INTEGER PRIMARY KEY,
    triggered_at REAL NOT NULL,
    status TEXT,                     -- 'success' | 'failed'
    files_updated INTEGER
);
```

### 4.3 缓存失效策略

```
┌─────────────────────────────────────────────────────────────┐
│                     缓存失效流程                             │
└─────────────────────────────────────────────────────────────┘

    Agent notify
        │
        ▼
┌─────────────────┐
│  sync-trigger   │
│    API 端点     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  执行 rclone    │
│  TOS ──▶ /root/notes-mvp  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  增量更新       │
│  SQLite 缓存    │
│  • 文件树更新   │
│  • FTS 索引更新 │
│  • 链接图谱更新 │
└─────────────────┘
```

---

## 5. 方案对比

| 维度 | 纯内存缓存 | SQLite 缓存 | 不做缓存 |
|------|-----------|-------------|---------|
| 实现复杂度 | 低 | 中 | 无 |
| 重启后保留 | ❌ | ✅ | - |
| 搜索性能 | 一般 | **优秀** (FTS5) | 差 |
| 图谱查询 | 一般 | **优秀** | 差 |
| 增量更新 | 困难 | **容易** | - |
| 部署依赖 | 无 | SQLite (已有) | 无 |

---

## 6. 结论

### 6.1 推荐方案

**使用 SQLite 作为缓存层**，理由如下：

1. **搜索是核心功能** - SQLite FTS5 对全文搜索有原生支持，性能优秀
2. **链接图谱需要结构化数据** - 关系型数据库存储链接关系比文件系统更合适
3. **增量更新容易** - sync-trigger 后可以增量更新缓存，无需全量重建
4. **部署环境已有** - 不需要额外部署

### 6.2 注意事项

- HTML 文件是**事实来源 (Source of Truth)**，SQLite 只是缓存层
- sync-trigger 后必须同步更新 SQLite 缓存
- 如果 rclone 同步失败，需要回滚或标记缓存为失效

---

## 7. 待确认问题

1. HTML 转换器是现有工具还是需要开发？
2. 链接图谱的解析规则（如何从 HTML 中提取链接）？
3. 是否需要支持 Markdown 实时预览？

---

## 8. 后续步骤

1. [ ] 确认 HTML 转换方案
2. [ ] 设计详细的 SQLite schema
3. [ ] 实现 sync-trigger 后的缓存更新逻辑
4. [ ] 实现文件树缓存 API
5. [ ] 实现 FTS 搜索 API
6. [ ] 实现链接图谱数据 API
7. [ ] 前端集成

---

## 9. 部署注意事项

### 9.1 开发环境

- **Python sqlite3 模块**：Python 标准库，无需安装
- **SQLite 文件位置**：`./backend/data/notes.db`
- **启动命令**：`DATA_PATH=./backend/data python -m uvicorn backend.app.main:app`

### 9.2 VPS 部署

```bash
# 环境变量
DATA_PATH=/opt/note-web/backend/data
NOTES_PATH=/root/notes-mvp
ACCESS_TOKEN=<your-token>

# 目录结构
/opt/note-web/
└── backend/
    ├── app/
    │   ├── main.py
    │   └── database.py    # SQLite 数据库模块
    ├── static/
    └── data/
        └── notes.db       # SQLite 数据库文件

# 权限
chown -R note-web:note-web /opt/note-web/backend/data
```

### 9.3 关键说明

| 项目 | 说明 |
|------|------|
| SQLite | Python 标准库 `sqlite3`，无需额外安装 |
| 数据库文件 | 位于 `data/` 目录下，重启后数据保留 |
| 缓存失效 | `sync-trigger` 时自动更新缓存 |
| 数据目录 | 部署时需创建并设置正确的 owner |

### 9.4 数据库初始化

首次部署时，SQLite 数据库会自动创建并初始化表结构。无需手动执行 SQL。
