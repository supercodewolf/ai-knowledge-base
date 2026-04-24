# AI Knowledge Base Q&A - 智能知识库问答系统

## Concept & Vision
一个基于RAG（检索增强生成）技术的智能知识库问答系统。融合现代图书馆的智慧与科技的未来感，以深邃的靛蓝色调配合柔和的渐变，营造专业、可信赖的知识探索氛围。用户可以上传文档，构建个人知识库，然后通过自然语言提问获取精准答案。

## Design Language

### Aesthetic Direction
智慧图书馆主题 (Digital Library Theme)
- 主背景：深邃的靛蓝色 (`#0f172a`)
- 次级背景：暗蓝色 (`#1e293b`)
- 卡片背景：半透明深色 (`rgba(30, 41, 59, 0.8)`)
- 主色调：科技蓝 (`#0ea5e9`)
- 辅助色：紫罗兰 (`#8b5cf6`)
- 强调色：翡翠绿 (`#10b981`)
- 文字色：冷白 (`#f1f5f9`)，次级 (`#94a3b8`)

### Typography
- 主字体：Source Sans Pro (Google Fonts)
- 标题：600 weight, tracking-tight
- 正文：400 weight, leading-relaxed
- 代码：Fira Code

### Spatial System
- 基础单位：8px
- 卡片圆角：12px - 16px
- 面板间距：24px
- 内边距：16px - 24px

### Motion Philosophy
- 入场动画：淡入上移，带有弹性
- 文件上传：进度条动画
- 问答生成：流式文字显示
- 悬停效果：发光边框
- 加载状态：优雅的骨架屏

## Layout & Structure

### 整体布局
```
┌────────────────────────────────────────────────────────┐
│  Header (Logo + 标题)                                  │
├──────────────────┬─────────────────────────────────────┤
│                  │                                     │
│  Knowledge Base  │  Q&A Interface                      │
│  Panel           │  - 搜索框                            │
│  - 上传区域       │  - 对话列表                         │
│  - 文档列表       │  - 输入区域                         │
│  - 统计信息       │                                     │
│                  │                                     │
├──────────────────┴─────────────────────────────────────┤
│  Footer (版权信息)                                     │
└────────────────────────────────────────────────────────┘
```

### 响应式策略
- 桌面端：双栏布局，文档管理 + 问答
- 平板端：可折叠侧边栏
- 移动端：底部标签切换

## Features & Interactions

### 核心功能
1. **文档管理**
   - 支持拖拽上传（PDF、TXT、MD、DOCX）
   - 文档列表展示（名称、大小、上传时间）
   - 删除文档
   - 文档统计（数量、字符数）

2. **智能问答**
   - 自然语言提问
   - 基于上传文档的精准回答
   - 引用来源标注
   - 多轮对话上下文

3. **答案展示**
   - 流式输出
   - 引用高亮
   - 可复制答案
   - 相似问题推荐

### 交互细节
- **文件上传**：拖拽或点击，支持多文件
- **提问**：Enter发送，支持Shift+Enter换行
- **答案生成**：逐字显示，实时渲染
- **来源引用**：点击跳转到相关文档片段

### 边界情况
- 无文档：提示上传文档
- 上传中：进度显示
- 网络错误：重试按钮
- 空答案：友好提示

## Component Inventory

### UploadZone
- 拖拽区域
- 文件类型提示
- 上传进度条

### DocumentCard
- 文档图标
- 文档名称
- 元信息
- 删除按钮

### QuestionInput
- 多行文本输入
- 发送按钮
- 字数统计

### AnswerBubble
- 答案内容
- 来源引用
- 复制按钮
- 时间戳

### SourceCitation
- 文档名称
- 引用片段
- 相似度分数

## Technical Approach

### 前端技术
- 纯 HTML5 + CSS3 + Vanilla JavaScript
- CSS Grid + Flexbox 布局
- CSS 变量管理主题
- IndexedDB 本地存储文档

### AI 集成
- 预留 OpenAI API 接口
- 支持流式输出（SSE）
- 嵌入模型生成向量
- 简单关键词匹配检索

### 数据结构
```javascript
// 文档
{
  id: string,
  name: string,
  type: string,
  size: number,
  content: string,
  chunks: string[],
  createdAt: number
}

// 问答记录
{
  id: string,
  question: string,
  answer: string,
  sources: Source[],
  timestamp: number
}

// 来源
{
  documentId: string,
  documentName: string,
  chunk: string,
  score: number
}
```

### API 配置
```javascript
{
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  embeddingEndpoint: 'https://api.openai.com/v1/embeddings',
  model: 'gpt-3.5-turbo',
  embeddingModel: 'text-embedding-ada-002'
}
```

### 简化实现说明
由于是纯前端应用，本项目采用简化的检索方案：
1. 文档被分割成文本块（chunks）
2. 用户提问时，通过关键词匹配找到相关文本块
3. 将相关文本块作为上下文提供给AI生成答案
4. 答案中标注可能的来源

这种方案适合小规模知识库，对于大规模应用建议使用向量数据库。
