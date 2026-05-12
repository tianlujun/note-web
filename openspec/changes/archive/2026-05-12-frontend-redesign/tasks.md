# 前端重建实现任务

## 1. 项目脚手架

- [x] 1.1 初始化 React + Vite + TypeScript 项目 (`npm create vite@latest`)
- [x] 1.2 配置 Tailwind CSS v4 (CSS-first 配置)
- [x] 1.3 安装并初始化 shadcn/ui (`npx shadcn@latest init`)
- [x] 1.4 安装必要依赖 (Zustand, React Router, Lucide, React Flow)
- [x] 1.5 配置 ESLint 和 TypeScript
- [x] 1.6 设置项目目录结构

## 2. 样式系统

- [x] 2.1 创建 globals.css 定义 CSS 变量（深色/浅色主题）
- [x] 2.2 配置 Tailwind 的 dark mode (class strategy)
- [x] 2.3 设置字体 (Inter + JetBrains Mono)
- [x] 2.4 定义间距和圆角系统
- [x] 2.5 创建 cn() 工具函数

## 3. shadcn/ui 组件

- [x] 3.1 添加 Button 组件
- [x] 3.2 添加 Input 组件
- [x] 3.3 添加 Tabs 组件
- [x] 3.4 添加 Dialog 组件
- [x] 3.5 添加 DropdownMenu 组件
- [x] 3.6 添加 ScrollArea 组件
- [x] 3.7 添加 Skeleton 组件

## 4. 主题系统

- [x] 4.1 创建 ThemeProvider context
- [x] 4.2 创建 ThemeToggle 组件
- [x] 4.3 实现 localStorage 持久化
- [x] 4.4 实现系统偏好检测
- [x] 4.5 添加深色/浅色 CSS 变量

## 5. API 层

- [x] 5.1 创建 API 客户端 (`lib/api.ts`)
- [x] 5.2 实现认证 API 调用 (login, logout, me)
- [x] 5.3 实现文件树 API 调用
- [x] 5.4 实现搜索 API 调用
- [x] 5.5 实现图谱 API 调用
- [x] 5.6 创建 useApi 通用 hook

## 6. 状态管理

- [x] 6.1 创建 authStore (Zustand)
- [x] 6.2 创建 tabStore (Zustand)
- [x] 6.3 创建 fileTreeStore (Zustand)
- [x] 6.4 实现 sessionStorage 持久化

## 7. 布局组件

- [x] 7.1 创建 AppShell 布局
- [x] 7.2 创建 Sidebar 组件 (支持折叠)
- [x] 7.3 实现移动端响应式 (抽屉模式)
- [x] 7.4 创建 TabBar 组件
- [x] 7.5 创建 ContentArea 组件
- [x] 7.6 创建移动端 hamburger 按钮

## 8. 文件树

- [x] 8.1 创建 FileTree 组件
- [x] 8.2 实现目录展开/折叠
- [x] 8.3 实现目录状态记忆
- [x] 8.4 实现活动文件高亮
- [x] 8.5 添加加载骨架屏
- [x] 8.6 添加错误状态和重试

## 9. 搜索

- [x] 9.1 创建 SearchInput 组件
- [x] 9.2 实现搜索展开/收起动画
- [x] 9.3 实现 300ms 防抖
- [x] 9.4 创建搜索结果下拉
- [x] 9.5 实现 / 键快捷触发
- [x] 9.6 实现 ESC 关闭

## 10. 标签页

- [x] 10.1 实现 Tab 组件样式
- [x] 10.2 实现关闭按钮
- [x] 10.3 实现活跃标签样式
- [x] 10.4 实现横向滚动
- [x] 10.5 实现空状态

## 11. 内容区

- [x] 11.1 实现 Shadow DOM 渲染
- [x] 11.2 实现链接拦截 (内部导航)
- [x] 11.3 实现滚动位置恢复
- [x] 11.4 添加加载骨架屏
- [x] 11.5 添加错误状态和重试
- [x] 11.6 实现空状态

## 12. 图谱视图 (React Flow)

- [x] 12.1 安装 @xyflow/react 和 dagre
- [x] 12.2 创建 GraphView 组件
- [x] 12.3 实现 Dagre 自动布局
- [x] 12.4 实现节点点击跳转
- [x] 12.5 实现平移和缩放 (包括移动端 pinch)
- [x] 12.6 创建全屏模态框
- [x] 12.7 添加加载和空状态
- [x] 12.8 实现键盘导航 (Tab 在节点间移动)

## 13. 登录页

- [x] 13.1 创建 LoginPage 组件
- [x] 13.2 实现 Token 输入框
- [x] 13.3 实现登录按钮
- [x] 13.4 添加加载状态
- [x] 13.5 添加错误提示
- [x] 13.6 添加装饰印章 SVG

## 14. 键盘快捷键

- [x] 14.1 创建 useKeyboardShortcuts hook
- [x] 14.2 实现 / 打开搜索
- [x] 14.3 实现 Ctrl+W 关闭标签
- [x] 14.4 实现 Ctrl+Tab 切换标签
- [x] 14.5 实现 Ctrl+Shift+Tab 反向切换
- [x] 14.6 实现 ESC 关闭搜索/图谱

## 15. 页面路由

- [x] 15.1 配置 React Router
- [x] 15.2 创建 /login 路由
- [x] 15.3 创建 /app 布局
- [x] 15.4 创建 /app/notes/[...path] 路由
- [x] 15.5 实现路由守卫 (未登录重定向)

## 16. 收尾

- [ ] 16.1 验证所有 API 端点正常工作
- [ ] 16.2 测试深色/浅色切换
- [ ] 16.3 测试移动端响应式
- [ ] 16.4 验证键盘快捷键
- [ ] 16.5 验证 SPEC.md 与实现一致
- [ ] 16.6 构建并测试生产版本
