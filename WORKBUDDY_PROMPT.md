# 金钥匙 (Golden Key) — 完整开发需求

## 定位
跨平台桌面端产品管理工具（Tauri v2 + React + TypeScript + Tailwind CSS），面向跨境电商/外贸场景。

---

## 功能清单

### 一、产品基础管理
- 产品列表：展示所有产品卡片，支持搜索、筛选
- 新建产品：创建空白产品，进入编辑页
- 编辑产品：修改已有产品的全部信息
- 删除产品：移除不需要的产品

### 二、基本信息（Basic Info Tab）
| 字段 | 说明 |
|------|------|
| 产品标题 | 中英双语（title_zh / title_en） |
| 产品描述 | 中英双语短描述（description_zh / description_en） |
| 成本价 | 录入采购/生产成本 |

### 三、详情描述（Descriptions Tab）
- 富内容编辑器：左右双栏（中文 / 英文）并排显示
- 每栏支持文本块和图片块，自由混排
- 每个内容块可独立增删、上下拖拽排序
- AI 生成详情：三种模式（仅中文 / 仅英文 / 双语同时）

### 四、AI 智能生成（核心差异化功能）
- AI 标题生成：输入参考信息 → 生成中英文标题，预览后一键应用
- AI 定价建议：基于成本价 + 产品信息 → 推荐销售价格，给出定价理由
- AI 详情页生成：三种模式，生成后预览确认，插入编辑器作为文本块

### 五、产品图片管理（Images Tab）
- 多图批量上传
- 缩略图网格展示
- 设为主图
- 点击查看大图、删除

### 六、成本利润计算（Pricing Tab）
- 成本价 / 销售价录入
- 自动计算：利润率、利润额
- 可视化条形图展示成本/利润/售价占比

### 七、标签管理（Tags Tab）
- 为产品打标签
- 标签编辑（增删）
- 通过标签快速筛选产品

### 八、通用能力
- 暗色/亮色模式切换
- 本地存储（SQLite）
- 实时保存
- 响应式 UI

---

## 技术栈
| 层级 | 技术 |
|------|------|
| 桌面框架 | Tauri v2（Rust 后端） |
| 前端框架 | React 18 + TypeScript |
| 样式方案 | Tailwind CSS |
| 图标 | Lucide React |
| 状态管理 | React useState / useEffect |
| 数据库 | SQLite（通过 Tauri Command 操作） |
| AI 集成 | Stub（可替换为 OpenAI / Claude / DeepSeek） |

---

## 数据模型

```typescript
interface Product {
  id: string;
  titleZh: string;       // 中文标题
  titleEn: string;        // 英文标题
  descriptionZh: string;  // 中文描述
  descriptionEn: string;  // 英文描述
  costPrice: number;      // 成本价
  sellingPrice: number | null;  // 销售价
  images: ProductImage[];
  contentBlocks: ContentBlock[];  // 富内容块数组
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ContentBlock {
  id: string;
  lang: 'zh' | 'en';
  type: 'text' | 'image';
  content: string;   // text: HTML内容, image: URL/路径
  sortOrder: number;
}

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  alt: string;
}
```

---

## Tauri Command API（Rust 后端）

```rust
#[tauri::command] fn get_all_products() -> Vec<Product>
#[tauri::command] fn get_product(id: String) -> Product
#[tauri::command] fn create_product(data: ProductInput) -> Product
#[tauri::command] fn update_product(id: String, data: ProductInput) -> Product
#[tauri::command] fn delete_product(id: String) -> bool

// AI（Stub）
#[tauri::command] fn ai_generate_title(info: String) -> AITitleResult
#[tauri::command] fn ai_suggest_price(cost: f64, info: String) -> AIPriceResult
#[tauri::command] fn ai_generate_description(product: ProductInput, lang: String) -> Value
```

---

## 项目结构

```
golden-key-app/
├── src/                    # React 前端
│   ├── App.tsx             # 主组件
│   ├── main.tsx            # 入口
│   ├── index.css           # Tailwind 入口
│   ├── types/index.ts      # 类型定义
│   └── components/         # UI 组件
├── src-tauri/              # Rust 后端
│   ├── src/lib.rs          # 数据库 + Commands
│   └── Cargo.toml
├── package.json
├── SPEC.md                 # 详细规格文档
└── README.md
```

---

## 设计风格

- 暗色模式默认（商务深色主题）
- 主色：#F5A623（金钥匙黄）
- 强调色：#1A73E8（操作蓝）
- 字体：Inter + JetBrains Mono
- 卡片式布局，大量留白，微交互

---

## 已有基础（可直接使用）

项目已在 ~/Projects/golden-key-app/ 初始化完成：
- ✅ package.json（所有依赖已配置）
- ✅ Tailwind / TypeScript / Vite 配置完成
- ✅ SPEC.md 完整设计文档
- ✅ 前端主要组件代码（App.tsx + types/index.ts + components/TabComponents.tsx）
- ✅ Rust 后端框架（lib.rs 含数据库 + Commands）

**待完成：AI Stub 替换为真实 API 接入（OpenAI/Claude/DeepSeek）**

---

请基于以上需求，补全或优化项目代码，实现一个完整的可运行版本。
