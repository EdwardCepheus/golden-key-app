// ============================================================
// 金钥匙 × WorkBuddy 数据分析模块 - 类型定义
// ============================================================

import type { Product } from "../../types";

// 数据类型
export type DataType = "products" | "sales" | "inventory" | "customer" | "analytics";

// 分析类型
export type AnalysisType = 
  | "trend"           // 趋势分析
  | "comparison"      // 对比分析
  | "anomaly"         // 异常检测
  | "profit"          // 利润分析
  | "full";           // 全面分析

// 输出格式
export type OutputFormat = "clipboard" | "file";

// ============================================================
// 数据包结构 - 发送给 WorkBuddy 的标准格式
// ============================================================

export interface AnalysisPackage {
  // 元数据
  meta: {
    app: "金钥匙";
    version: string;
    timestamp: string;
    dataType: DataType;
    recordCount: number;
  };
  
  // 数据内容
  data: {
    // JSON 格式数据
    json?: unknown;
    // CSV 格式数据
    csv?: string;
    // 表格摘要（用于提示词）
    summary: string;
  };
  
  // 分析要求
  request: {
    analysisType: AnalysisType;
    customQuestions?: string[];
  };
}

// ============================================================
// 销售数据导出格式
// ============================================================

export interface SalesExportRecord {
  id: string;
  titleZh: string;
  titleEn: string;
  category: string;
  costPrice: number;          // 成本 (元)
  sellingPrice: number | null; // 售价 (元)
  profit: number | null;      // 利润 (元)
  profitRate: number | null;  // 利润率 (%)
  tags: string;
}

// ============================================================
// 利润分析导出格式
// ============================================================

export interface ProfitAnalysisRecord {
  id: string;
  title: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  totalCost: number;          // 总成本（成本+物流+打包+佣金）
  profit: number;
  profitRate: number;
  isLossLeader: boolean;      // 亏损引流商品
  isHighMargin: boolean;      // 高利润商品 (>30%)
  status: "profit" | "breakeven" | "loss";
}

// ============================================================
// 提示词模板
// ============================================================

export interface PromptTemplate {
  name: string;
  description: string;
  template: string;
}

// ============================================================
// 导出选项
// ============================================================

export interface ExportOptions {
  format: "json" | "csv" | "markdown";
  analysisType: AnalysisType;
  customQuestions?: string[];
  includeMetadata?: boolean;
}

// ============================================================
// 导出结果
// ============================================================

export interface ExportResult {
  success: boolean;
  content: string;
  format: ExportOptions["format"];
  recordCount: number;
  copiedToClipboard?: boolean;
  error?: string;
}
