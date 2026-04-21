// ============================================================
// 金钥匙 × WorkBuddy 数据分析模块 - 统一导出
// ============================================================

// 类型
export * from "./types";

// 模板
export {
  TEMPLATE_MAP,
  DEFAULT_QUESTIONS,
  getAnalysisTypeName,
  SALES_ANALYSIS_TEMPLATE,
  PROFIT_ANALYSIS_TEMPLATE,
  PRODUCT_ANALYSIS_TEMPLATE,
  COMPETITIVE_ANALYSIS_TEMPLATE,
} from "./templates";

// 导出器
export {
  exportProducts,
  quickExport,
  toSalesRecord,
  toProfitRecord,
  toJSON,
  toCSV,
  toMarkdown,
  generateSummary,
} from "./exporter";

// 剪贴板
export { copyToClipboard, readFromClipboard, showCopyNotification } from "./clipboard";

// React Hook
export { useWorkbuddyExport } from "./useWorkbuddyExport";
