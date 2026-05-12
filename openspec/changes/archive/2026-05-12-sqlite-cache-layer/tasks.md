# SQLite 缓存层实现任务

## 1. 数据库基础设施

- [x] 1.1 创建 `backend/app/database.py` 模块
- [x] 1.2 实现 `get_db()` 数据库连接上下文管理器
- [x] 1.3 实现 `init_db()` 数据库初始化函数（创建表结构）
- [x] 1.4 在 FastAPI 启动时调用 `init_db()`
- [x] 1.5 添加 `DATA_PATH` 环境变量支持

## 2. 文件树缓存

- [x] 2.1 设计并创建 `files` 表
- [x] 2.2 实现 `get_file_tree()` 从数据库读取文件树
- [x] 2.3 实现 `build_tree_from_fs()` 扫描文件系统
- [x] 2.4 实现 `update_tree_cache()` 增量更新文件树
- [x] 2.5 修改 `/api/files` 使用数据库查询
- [x] 2.6 处理 `_index.html` 文件标记

## 3. 全文搜索 (FTS5)

- [x] 3.1 创建 FTS5 虚拟表 `search_index`
- [x] 3.2 实现 `rebuild_search_index()` 全量重建索引
- [x] 3.3 实现增量更新 `search_index`（只更新变化文件）
- [x] 3.4 实现 `search_notes()` FTS5 查询
- [x] 3.5 修改 `/api/search` 使用 FTS5
- [x] 3.6 保持返回格式：`{path, title, snippet}`

## 4. 链接图谱

- [x] 4.1 设计并创建 `links` 表
- [x] 4.2 设计并创建 `nodes` 表
- [x] 4.3 实现 `extract_links()` 从 HTML 解析内部链接
- [x] 4.4 实现 `extract_links()` 从 HTML 解析外部链接
- [x] 4.5 实现 `update_link_cache()` 增量更新图谱数据
- [x] 4.6 修改 `/api/link-index` 从数据库查询
- [x] 4.7 保持返回格式：`{nodes: [...], edges: [...]}`

## 5. 同步与缓存失效

- [x] 5.1 设计并创建 `sync_log` 表
- [x] 5.2 修改 `/api/sync-trigger` 在 rclone 后更新缓存
- [x] 5.3 实现增量更新逻辑（对比 modified_at）
- [x] 5.4 实现 `POST /api/cache/rebuild` 手动全量重建
- [x] 5.5 实现 `GET /api/cache/status` 缓存状态查询

## 6. 测试与验证

- [x] 6.1 验证 `/api/files` 返回正确文件树
- [x] 6.2 验证 `/api/search` 搜索功能正常
- [x] 6.3 验证 `/api/link-index` 图谱数据正确
- [x] 6.4 验证 `sync-trigger` 后缓存正确更新
- [x] 6.5 验证性能：文件树 < 100ms，搜索 < 200ms

## 7. 文件内容缓存（新增）

- [x] 7.1 修改 `files` 表，添加 `title` 和 `content` 字段
- [x] 7.2 修改 `update_tree_cache()` 在缓存时存储文件内容
- [x] 7.3 修改 `/api/file/{path}` 从缓存返回完整内容 `{path, title, content}`
- [x] 7.4 移除 `/notes/{path}` 端点（或保留仅用于静态资源）
- [x] 7.5 测试 `/api/file/{path}` 返回正确内容

## 8. 部署准备

- [x] 8.1 更新 SPEC.md 文档（反映新架构）
- [x] 8.2 确保部署 agent 了解 `DATA_PATH` 环境变量
- [x] 8.3 验证 SQLite 数据库文件权限设置正确
