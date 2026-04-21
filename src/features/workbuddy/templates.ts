// ============================================================
// 金钥匙 × WorkBuddy 提示词模板库
// ============================================================

import type { PromptTemplate, AnalysisType } from "./types";

// ============================================================
// 基础分析模板
// ============================================================

export const BASE_TEMPLATE = `\
# 金钥匙数据分析请求 🤖✨

## 📊 数据概览
{data_summary}

## 📋 原始数据
{formatted_data}

## 🎯 分析要求
- **分析类型**: {analysis_type}
- **商品数量**: {record_count} 个
- **数据时间**: {timestamp}

## ❓ 具体问题
{custom_questions}

## 📤 请提供以下分析结果

### 1️⃣ 核心发现 (3-5 条)
请列出最重要的数据洞察

### 2️⃣ 数据可视化建议
推荐使用什么类型的图表来展示

### 3️⃣ 行动建议
基于数据给出具体可执行的建议

### 4️⃣ ⚠️ 风险提示
如果有异常数据或潜在问题，请标注

---

💡 **回复格式要求**:
- 使用 emoji 增强可读性
- 关键数字加粗
- 结构清晰，层次分明
- 请用中文回答
`;

// ============================================================
// 场景化分析模板
// ============================================================

export const SALES_ANALYSIS_TEMPLATE: PromptTemplate = {
  name: "销售分析",
  description: "分析 Etsy/Taobao 销售数据，找出畅销品、趋势、预测",
  template: `\
# 🛒 销售数据分析请求

## 📊 数据概览
{summary}

## 📋 商品数据
{data}

## 🎯 请帮我完成以下分析

### 1️⃣ 产品排名分析
- 找出 **TOP 5 畅销产品**（按利润率排序）
- 找出 **TOP 5 高销量产品**
- 分析利润率分布

### 2️⃣ 趋势分析
- 分析不同品类的销售表现
- 识别增长趋势和下降趋势

### 3️⃣ 异常检测
- 识别利润率异常的商品（过高或过低）
- 识别可能需要调整定价的商品

### 4️⃣ 选品建议
- 基于现有数据分析
- 给出品类扩展建议

### 5️⃣ 定价优化
- 哪些商品可以适当提价？
- 哪些商品需要降价促销？

## 📤 输出要求
请用 Markdown 格式输出，包含 emoji，使用表格展示排名数据。
`,
};

export const PROFIT_ANALYSIS_TEMPLATE: PromptTemplate = {
  name: "利润分析",
  description: "深度分析利润结构，找出优化空间",
  template: `\
# 💰 利润结构分析请求

## 📊 利润数据概览
{summary}

## 📋 详细数据
{data}

## 🎯 分析维度

### 1️⃣ 利润分层
- **高利润商品** (利润率 > 30%): 列出这些商品，分析成功因素
- **中等利润** (利润率 15-30%): 稳定贡献，分析优化空间
- **低利润商品** (利润率 5-15%): 关注成本控制
- **亏损/零利润商品** (利润率 ≤ 5%): 需要重点关注

### 2️⃣ 成本结构分析
- 物流成本占比是否合理？
- 打包成本是否过高？
- 平台佣金是否有优化空间？

### 3️⃣ 定价策略建议
- 哪些商品建议**提价**？
- 哪些商品建议**降价**？
- 哪些商品建议**清仓**？

### 4️⃣ 利润预测
- 如果优化定价，预计可增加多少利润？

## 📤 输出要求
- 使用表格清晰展示分类结果
- 给出具体数字和百分比
- 附上可执行的行动清单
`,
};

export const PRODUCT_ANALYSIS_TEMPLATE: PromptTemplate = {
  name: "商品分析",
  description: "全面分析商品结构，给出优化建议",
  template: `\
# 📦 商品结构分析请求

## 📊 商品概览
{summary}

## 📋 完整商品列表
{data}

## 🎯 分析维度

### 1️⃣ 商品覆盖率
- 覆盖了多少个品类？
- 哪些品类商品数量较少？

### 2️⃣ 标签分析
- 高频标签有哪些？
- 哪些标签组合最有价值？

### 3️⃣ 标题优化建议
- 现有标题的 SEO 表现
- 标题关键词优化建议

### 4️⃣ 描述优化建议
- 现有描述的优缺点
- 改进建议

### 5️⃣ 商品分层
- **核心商品** (利润率 > 20%): 重点维护
- **潜力商品** (利润率 10-20%): 优化提升
- **待优化商品** (利润率 < 10%): 需要改进

## 📤 输出要求
- 结构清晰，使用 Markdown 格式
- 给出具体的优化建议
- 附上优先级排序
`,
};

export const COMPETITIVE_ANALYSIS_TEMPLATE: PromptTemplate = {
  name: "竞品分析",
  description: "基于商品数据做竞品对标分析",
  template: `\
# 🎯 竞品对标分析请求

## 📊 商品数据
{summary}

## 📋 商品详情
{data}

## 🎯 分析维度

### 1️⃣ 价格竞争力
- 与同类商品相比，价格定位是否合理？
- 价格带分布是否健康？

### 2️⃣ 卖点分析
- 现有商品的差异化卖点
- 建议补充的卖点方向

### 3️⃣ 目标客户画像
- 基于商品定位，推测目标客户
- 客户购买决策因素分析

### 4️⃣ 竞争优势提炼
- 我们的核心优势是什么？
- 如何在营销中突出这些优势？

## 📤 输出要求
- 给出清晰的分析结论
- 附上营销文案建议
`,
};

// ============================================================
// 模板映射
// ============================================================

export const TEMPLATE_MAP: Record<AnalysisType, PromptTemplate> = {
  trend: SALES_ANALYSIS_TEMPLATE,
  comparison: COMPETITIVE_ANALYSIS_TEMPLATE,
  anomaly: SALES_ANALYSIS_TEMPLATE,
  profit: PROFIT_ANALYSIS_TEMPLATE,
  full: PRODUCT_ANALYSIS_TEMPLATE,
};

// ============================================================
// 获取默认问题列表
// ============================================================

export const DEFAULT_QUESTIONS: Record<AnalysisType, string[]> = {
  trend: [
    "哪些商品利润率最高？",
    "销量趋势如何？",
    "下个月应该主推哪些商品？",
  ],
  comparison: [
    "与竞争对手相比，我们的价格优势在哪里？",
    "哪些商品需要调整定价？",
  ],
  anomaly: [
    "有没有异常数据需要关注？",
    "哪些商品可能存在定价问题？",
  ],
  profit: [
    "如何提升整体利润率？",
    "哪些商品的成本可以优化？",
  ],
  full: [
    "给出商品优化优先级清单",
    "建议下一步的行动计划",
  ],
};

// ============================================================
// 辅助函数
// ============================================================

/**
 * 填充模板
 */
export function fillTemplate(
  template: string,
  params: {
    summary: string;
    data: string;
    analysis_type: string;
    record_count: number;
    timestamp: string;
    custom_questions: string;
  }
): string {
  return template
    .replace("{summary}", params.summary)
    .replace("{data}", params.data)
    .replace("{analysis_type}", params.analysis_type)
    .replace("{record_count}", String(params.record_count))
    .replace("{timestamp}", params.timestamp)
    .replace("{custom_questions}", params.custom_questions);
}

/**
 * 获取分析类型的中文名称
 */
export function getAnalysisTypeName(type: AnalysisType): string {
  const names: Record<AnalysisType, string> = {
    trend: "📈 趋势分析",
    comparison: "⚖️ 对比分析",
    anomaly: "🔍 异常检测",
    profit: "💰 利润分析",
    full: "📊 全面分析",
  };
  return names[type];
}
