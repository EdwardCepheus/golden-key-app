# 金钥匙 (Golden Key) — 产品管理工具

## 1. Concept & Vision

金钥匙是一款面向跨境电商/外贸从业者的 **AI 驱动本地产品管理工具**。核心理念是"一键生成、一站管理"——从产品资料到多语言详情页，全部在本地桌面完成，让卖家把精力放在选品和运营上，而非繁琐的资料整理。工具感克制，AI 感自然，像一个懂外语、懂电商的聪明助手。

## 2. Design Language

### Aesthetic Direction
商务专业感，但不死板。参考 Linear / Notion 的设计语言——干净的卡片、大量留白、精确的微交互。暗色模式为默认（跨境从业者日常盯屏），亮色模式可选。

### Color Palette
```
Primary:     #F5A623  (Golden Yellow — 钥匙金，呼应产品名)
Accent:      #1A73E8  (Action Blue — 按钮、链接)
Background:  #0F1117  (Deep Dark — 主背景)
Surface:     #1C1F27  (Card Surface)
Border:      #2D3139  (Subtle Borders)
Text:        #E8EAED  (Primary Text)
TextMuted:   #9AA0A6  (Secondary Text)
Success:     #34A853
Warning:     #FBBC04
Error:       #EA4335
```

### Typography
- **Primary Font**: Inter (UI 文字)
- **Mono Font**: JetBrains Mono (代码/数字)
- 字号系统: 12/14/16/20/24/32px
- 行高: 1.5 (正文), 1.2 (标题)

### Spatial System
- 基础单位: 4px
- 卡片圆角: 12px
- 按钮圆角: 8px
- 内边距: 16px / 24px / 32px
- 卡片间距: 16px

### Motion Philosophy
- 过渡: 150ms ease-out (hover), 200ms ease (page transition)
- 卡片悬停: translateY(-2px) + subtle shadow
- 按钮点击: scale(0.97) → scale(1)
- 列表加载: stagger fade-in, 50ms per item

## 3. Layout & Structure

### 主界面布局
```
┌─────────────────────────────────────────────────────┐
│  Logo + 搜索栏 + 快捷操作按钮 + 主题切换 + 设置     │  <- Header (56px)
├────────────┬────────────────────────────────────────┤
│            │                                        │
│  侧边栏     │         主内容区                       │
│  - 产品列表  │   (产品卡片网格 / 编辑器 / 设置)       │
│  - 快捷筛选  │                                        │
│  - 标签过滤  │                                        │
│  (240px)   │                                        │
│            │                                        │
└────────────┴────────────────────────────────────────┘
```

### 产品编辑页 Tab 结构
```
┌─ [基本信息] [详情描述] [图片管理] [定价计算] [标签管理] ─┐
│                                                          │
│                    Tab 内容区                             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 响应式策略
- 最小窗口: 1024 x 768
- 侧边栏可折叠
- 编辑器区域自适应

## 4. Features & Interactions

### 4.1 产品列表
- 卡片网格展示，每卡: 主图 + 标题 + 成本价 + 利润率标签
- 顶栏: 搜索框 + 新建按钮 + 筛选下拉
- 点击卡片 → 进入编辑页
- 右键卡片 → 上下文菜单 (编辑/删除/复制)
- 空状态: 插画 + "还没有产品，创建一个吧"

### 4.2 新建 / 编辑产品
- 新建 → 空白编辑页，各 Tab 可编辑
- 编辑 → 加载已有数据，各 Tab 可修改
- 删除 → 二次确认弹窗，确认后删除并返回列表

### 4.3 基本信息 Tab (Basic Info)
| 字段 | 类型 | 说明 |
|------|------|------|
| 产品标题(ZH) | 文本 | 中文产品名称 |
| 产品标题(EN) | 文本 | 英文产品名称 |
| 产品描述(ZH) | 文本 | 中文短描述 |
| 产品描述(EN) | 文本 | 英文短描述 |
| 成本价 | 货币 | 采购/生产成本 |

### 4.4 详情描述 Tab (Descriptions)
**富内容编辑器 — 左右双栏布局:**
- 左栏: 中文详情编辑区
- 右栏: 英文详情编辑区
- 同步滚动开关 (默认开启)

**内容块类型:**
- 文本块: 富文本编辑器 (粗体/斜体/列表/链接)
- 图片块: 上传/插入图片，显示缩略图

**块操作:**
- 每块顶部有操作栏: ↑ 拖拽 / ✏️ 编辑 / 🗑️ 删除
- 块之间 "+" 按钮添加新块
- 拖拽排序 (视觉占位符 + 放置高亮)

**AI 生成按钮:**
- 工具栏右侧: "✨ AI 生成详情"
- 点击 → 弹出 AI 生成面板 (见 4.7)

### 4.5 AI 标题生成
- 触发: 基本信息 Tab 的 "✨ AI 生成标题" 按钮
- 交互: 输入参考信息(textarea) → 点击 "生成" → 显示中英文候选标题 → 预览 → 一键应用到字段
- 状态流: idle → loading → preview → applied

### 4.6 AI 定价建议
- 触发: 定价计算 Tab 的 "✨ AI 推荐价格" 按钮
- 输入: 成本价 (必填) + 参考市场信息 (可选)
- 输出: 推荐售价 + 利润率 + 定价理由说明
- 一键应用按钮

### 4.7 AI 详情页生成
- 触发: 详情描述 Tab 的 "✨ AI 生成详情" 按钮
- 弹出面板:
  - 模式选择: 🌐 仅中文 / 🌐 仅英文 / 🌐 双语同时
  - 产品信息摘要 (自动带入)
  - "生成" 按钮
- 生成中: skeleton 加载动画
- 生成完成: 预览模式 → 确认插入 → 追加为新块 (不覆盖已有内容)

### 4.8 图片管理 Tab (Images)
- 上传区: 拖拽上传 or 点击选择 (支持批量)
- 网格展示: 缩略图 (120x120), 4列网格
- 图片操作: 点击设为封面 / 点击查看大图(Modal) / 删除
- 主图标记: 左上角金色 "主图" 标签
- 删除 Bug 提示: ⚠️ Tauri v2 WebView 删除有已知问题，需后续补丁

### 4.9 定价计算 Tab (Pricing)
- 成本价输入框
- 售价输入框 (或由 AI 建议填充)
- 自动计算显示:
  - 利润额 = 售价 - 成本价
  - 利润率 = (利润额 / 售价) × 100%
  - 月均销量估算 (可选输入)
  - 月利润估算
- 可视化: 简单条形图展示成本/利润/售价占比

### 4.10 标签管理 Tab (Tags)
- 已有标签: 彩色胶囊样式展示
- 新增: 输入框 + 回车添加
- 删除: 标签右上角 "×"
- 点击标签: 高亮显示，关联筛选产品列表

### 4.11 暗色/亮色模式
- Header 右上角太阳/月亮图标
- 点击切换，带 smooth transition
- 记住用户偏好 (localStorage)

## 5. Component Inventory

### ProductCard
- Default: 主图 + 标题(截断2行) + 成本价 + 利润率标签
- Hover: translateY(-2px), shadow 增强
- Selected: 蓝色边框

### TabBar
- Default: 文字灰色
- Active: 文字白色 + 底部金色指示条 (2px)
- Hover: 文字变亮

### RichTextBlock
- Toolbar: B / I / List / Link / Image
- Content: contenteditable div
- Drag handle: 左侧金色 Grip 图标

### ImageBlock
- Thumbnail: 240px 宽度, auto height
- Hover: 显示操作栏 (编辑/删除)
- Selected: 蓝色边框

### AIButton
- Default: 金色边框 + 金色文字, transparent bg
- Hover: 金色填充, 深色文字
- Loading: 旋转的金色 spinner + "生成中..."
- Disabled: 灰色, 不可点击

### ConfirmModal
- 半透明黑色遮罩
- 白色卡片, 警告文案 + 取消/确认按钮
- 确认按钮: 红色 (删除场景)

### EmptyState
- 居中插画 (钥匙 icon)
- 标题 + 描述 + 主操作按钮

## 6. Technical Approach

### 技术栈
| 层级 | 技术 |
|------|------|
| 桌面框架 | Tauri v2 (Rust 后端) |
| 前端框架 | React 18 + TypeScript |
| 样式方案 | Tailwind CSS |
| 图标 | Lucide React |
| 状态管理 | React useState / useEffect |
| 数据库 | SQLite (通过 Tauri Command 操作) |
| AI 集成 | stub (可替换为 OpenAI/Claude/DeepSeek) |
| 富文本 | Tiptap (@tiptap/react) |
| 拖拽 | @dnd-kit/core + @dnd-kit/sortable |

### Tauri Command API (Rust 后端)
```rust
// 产品 CRUD
#[tauri::command] fn get_all_products() -> Vec<Product>
#[tauri::command] fn get_product(id: i64) -> Product
#[tauri::command] fn create_product(data: ProductInput) -> Product
#[tauri::command] fn update_product(id: i64, data: ProductInput) -> Product
#[tauri::command] fn delete_product(id: i64) -> bool

// AI (stub)
#[tauri::command] fn ai_generate_title(info: &str) -> AITitleResult
#[tauri::command] fn ai_suggest_price(cost: f64, info: &str) -> AIPriceResult
#[tauri::command] fn ai_generate_description(product: ProductInput, lang: &str) -> String
```

### 数据模型
```typescript
interface Product {
  id: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  cost_price: number;
  selling_price: number | null;
  images: ProductImage[];
  content_blocks: ContentBlock[];  // 富内容块数组
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface ContentBlock {
  id: string;
  lang: 'zh' | 'en';
  type: 'text' | 'image';
  content: string;   // text: HTML内容, image: URL/路径
  sort_order: number;
}

interface ProductImage {
  id: string;
  url: string;
  is_primary: boolean;
  alt: string;
}
```

### 项目结构
```
golden-key-app/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   ├── pages/              # 页面
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具函数
│   ├── types/              # TypeScript 类型
│   └── styles/             # 全局样式
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── main.rs
│   │   ├── db.rs           # SQLite 操作
│   │   └── ai.rs           # AI stub
│   └── Cargo.toml
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── SPEC.md
```
