# Spring AI Portal

一个基于 Vue 3 + Vite 的 AI 应用门户前端项目，聚合了多种 AI 场景 Demo（聊天、客服、PDF 对话、小游戏等），用于快速演示与集成 Spring AI 后端能力。

## 项目特性

- 统一入口首页，卡片化展示多个 AI 应用
- AI 聊天（支持流式响应）
- 智能客服场景（Function Calling 风格）
- ChatPDF 场景（PDF 上传、问答、历史会话）
- 游戏化对话场景（哄哄模拟器）
- Vue Router 多页面路由组织

## 技术栈

- Vue 3
- Vite 6
- Vue Router 4
- Pinia
- Naive UI
- Heroicons
- PDFTron WebViewer（PDF 预览能力）

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Jacky-ZJQ/spring-ai-protal.git
cd spring-ai-protal
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发环境

```bash
npm run dev
```

默认启动后访问（以 Vite 输出为准）：

- [http://localhost:5173](http://localhost:5173)

### 4. 构建生产包

```bash
npm run build
```

### 5. 本地预览构建产物

```bash
npm run preview
```

## 后端依赖说明

当前前端代码中，后端地址使用硬编码：

- `http://localhost:8080`

涉及文件：

- `src/services/api.js`
- `src/views/ChatPDF.vue`

如果后端地址变化，请同步修改以上文件中的 `BASE_URL`。

## 主要页面路由

- `/`：Home
- `/ai-chat`：AI Chat
- `/customer-service`：Customer Service
- `/chat-pdf`：ChatPDF
- `/game`：Game Chat
- `/comfort-simulator`：Comfort Simulator

## 目录结构（简版）

```text
spring-ai-protal/
├─ public/                 # 静态资源（含 webviewer）
├─ src/
│  ├─ components/          # 通用组件
│  ├─ router/              # 路由配置
│  ├─ services/            # API 调用封装
│  ├─ utils/               # 工具函数
│  └─ views/               # 页面视图
├─ package.json
└─ README.md
```

## 开发建议

- Node.js 建议使用 18+（推荐 LTS）
- 推荐 IDE：VS Code + Volar 扩展
- 提交前建议执行：

```bash
npm run build
```

## 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

## 许可证

本项目基于 [Apache License 2.0](./LICENSE) 开源。
