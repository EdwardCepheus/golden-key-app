// ============================================================
// 金钥匙 × WorkBuddy 数据导出器
// ============================================================

import type { Product } from "../../types";
import { calcProfit, calcProfitRate, calcTotalCost } from "../../types";
import type {
  ExportOptions,
  ExportResult,
  SalesExportRecord,
  ProfitAnalysisRecord,
  AnalysisType,
} from "./types";
import { TEMPLATE_MAP, getAnalysisTypeName } from "./templates";

// ============================================================
// 核心转换函数
// ============================================================

/**
 * 将 Product 转换为销售分析记录
 */
export function toSalesRecord(p: Product): SalesExportRecord {
  const sellingPrice = p.sellingPrice ?? 0;
  const totalCost = calcTotalCost(p);
  const profit = sellingPrice > 0 ? sellingPrice - totalCost : null;
  const profitRate = sellingPrice > 0 ? calcProfitRate(totalCost, sellingPrice) : null;

  return {
    id: p.id,
    titleZh: p.titleZh,
    titleEn: p.titleEn,
    category: p.categoryName,
    costPrice: p.costPrice,
    sellingPrice: p.sellingPrice ?? 0,
    profit,
    profitRate,
    tags: p.tags.join(", "),
  };
}

/**
 * 将 Product 转换为利润分析记录
 */
export function toProfitRecord(p: Product): ProfitAnalysisRecord {
  const sellingPrice = p.sellingPrice ?? 0;
  const totalCost = calcTotalCost(p);
  const profit = sellingPrice > 0 ? sellingPrice - totalCost : null;
  const profitRate = sellingPrice > 0 ? calcProfitRate(totalCost, sellingPrice) : null;

  let status: "profit" | "breakeven" | "loss" = "profit";
  if (sellingPrice === 0) {
    status = "breakeven";
  } else if (profit !== null && profit <= 0) {
    status = "loss";
  }

  return {
    id: p.id,
    title: p.titleZh || p.titleEn || "未命名商品",
    category: p.categoryName,
    costPrice: p.costPrice,
    sellingPrice: p.sellingPrice ?? 0,
    totalCost,
    profit: profit ?? 0,
    profitRate: profitRate ?? 0,
    isLossLeader: profit !== null && profit < 0 && sellingPrice > 0,
    isHighMargin: profitRate !== null && profitRate > 30,
    status,
  };
}

/**
 * 生成摘要统计
 */
export function generateSummary(products: Product[]): string {
  const count = products.length;
  const withPrice = products.filter((p) => p.sellingPrice !== null && p.sellingPrice > 0);
  const totalCost = products.reduce((sum, p) => sum + calcTotalCost(p), 0);
  const avgCost = count > 0 ? totalCost / count : 0;
  const avgPrice = withPrice.length > 0
    ? withPrice.reduce((sum, p) => sum + (p.sellingPrice ?? 0), 0) / withPrice.length
    : 0;

  const categories = new Set(products.map((p) => p.categoryName)).size;
  const allTags = products.flatMap((p) => p.tags);
  const topTags = allTags
    .reduce((acc, tag) => acc.set(tag, (acc.get(tag) ?? 0) + 1), new Map<string, number>());

  const sortedTags = Array.from(topTags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => `${tag}(${count})`)
    .join(", ");

  return `\
📊 **数据概览**
- 商品总数: **${count}** 个
- 有定价商品: **${withPrice.length}** 个
- 覆盖品类: **${categories}** 个
- 平均成本: ¥${avgCost.toFixed(2)}
- 平均售价: ¥${avgPrice.toFixed(2)}
- 高频标签: ${sortedTags || "暂无"}
`;
}

// ============================================================
// 格式化函数
// ============================================================

/**
 * 转换为 JSON 格式
 */
export function toJSON(products: Product[]): string {
  const records = products.map((p) => ({
    id: p.id,
    title_zh: p.titleZh,
    title_en: p.titleEn,
    category: p.categoryName,
    cost: p.costPrice,
    logistics: p.logisticsCost,
    packaging: p.packagingCost,
    commission: p.platformCommission,
    total_cost: calcTotalCost(p),
    selling_price: p.sellingPrice,
    profit: p.sellingPrice ? p.sellingPrice - calcTotalCost(p) : null,
    profit_rate: p.sellingPrice ? calcProfitRate(calcTotalCost(p), p.sellingPrice).toFixed(1) + "%" : null,
    tags: p.tags,
    merchant_code: p.merchantCode,
  }));

  return JSON.stringify(records, null, 2);
}

/**
 * 转换为 CSV 格式
 */
export function toCSV(products: Product[]): string {
  const headers = [
    "ID",
    "商品名称(中)",
    "商品名称(英)",
    "品类",
    "成本",
    "物流",
    "打包",
    "佣金",
    "总成本",
    "售价",
    "利润",
    "利润率",
    "标签",
    "商家编码",
  ];

  const rows = products.map((p) => [
    p.id,
    `"${(p.titleZh || "").replace(/"/g, '""')}"`,
    `"${(p.titleEn || "").replace(/"/g, '""')}"`,
    `"${p.categoryName.replace(/"/g, '""')}"`,
    p.costPrice.toFixed(2),
    p.logisticsCost.toFixed(2),
    p.packagingCost.toFixed(2),
    p.platformCommission.toFixed(2),
    calcTotalCost(p).toFixed(2),
    p.sellingPrice?.toFixed(2) ?? "",
    p.sellingPrice ? (p.sellingPrice - calcTotalCost(p)).toFixed(2) : "",
    p.sellingPrice ? calcProfitRate(calcTotalCost(p), p.sellingPrice).toFixed(1) + "%" : "",
    `"${p.tags.join(";")}"`,
    `"${p.merchantCode}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * 转换为 Markdown 表格
 */
export function toMarkdown(products: Product[]): string {
  const records = products.map((p) => {
    const totalCost = calcTotalCost(p);
    const profit = p.sellingPrice ? p.sellingPrice - totalCost : null;
    const profitRate = p.sellingPrice ? calcProfitRate(totalCost, p.sellingPrice) : null;

    return {
      title: p.titleZh || p.titleEn || "未命名",
      category: p.categoryName,
      cost: `¥${p.costPrice.toFixed(0)}`,
      price: p.sellingPrice ? `¥${p.sellingPrice.toFixed(0)}` : "-",
      profit: profit !== null ? `¥${profit.toFixed(0)}` : "-",
      profitRate: profitRate !== null ? `${profitRate.toFixed(1)}%` : "-",
      tags: p.tags.slice(0, 2).join(", ") || "-",
    };
  });

  if (records.length === 0) {
    return "暂无商品数据";
  }

  const headers = ["商品名称", "品类", "成本", "售价", "利润", "利润率", "标签"];
  const widths = [20, 15, 10, 10, 10, 10, 12];

  const headerRow = `| ${headers.map((h, i) => h.padEnd(widths[i])).join(" | ") } |`;
  const separator = `| ${widths.map((w) => "-".repeat(w)).join(" | ") } |`;
  const dataRows = records.map((r) =>
    `| ${Object.values(r).map((v, i) => v.toString().padEnd(widths[i])).join(" | ") } |`
  );

  return [headerRow, separator, ...dataRows].join("\n");
}

// ============================================================
// 主导出函数
// ============================================================

/**
 * 导出商品数据
 */
export function exportProducts(
  products: Product[],
  options: ExportOptions
): ExportResult {
  const { format, analysisType, customQuestions } = options;

  // 生成摘要
  const summary = generateSummary(products);

  // 根据格式生成内容
  let content: string;
  switch (format) {
    case "json":
      content = toJSON(products);
      break;
    case "csv":
      content = toCSV(products);
      break;
    case "markdown":
    default:
      content = toMarkdown(products);
      break;
  }

  // 获取对应模板
  const template = TEMPLATE_MAP[analysisType];
  const analysisTypeName = getAnalysisTypeName(analysisType);

  // 生成完整提示词
  const questions = customQuestions?.length
    ? customQuestions.map((q) => `- ${q}`).join("\n")
    : "请给出综合分析报告";

  const prompt = template.template
    .replace("{summary}", summary)
    .replace("{data}", content)
    .replace("{analysis_type}", analysisTypeName);

  // 添加问题部分（追加到模板末尾）
  const fullPrompt = `${prompt}\n\n## ❓ 补充问题\n${questions}`;

  return {
    success: true,
    content: fullPrompt,
    format,
    recordCount: products.length,
  };
}

/**
 * 快速导出（用于剪贴板）
 */
export function quickExport(
  products: Product[],
  analysisType: AnalysisType = "full"
): ExportResult {
  return exportProducts(products, {
    format: "markdown",
    analysisType,
  });
}
