// ============================================================
// 金钥匙 - 类型定义 & 工具函数
// ============================================================

export type ContentBlockType = "text" | "image";
export type ContentLang = "zh" | "en";
export type TabId = "basic" | "descriptions" | "images" | "pricing" | "tags";

export interface ContentBlock {
  id: string;
  lang: ContentLang;
  type: ContentBlockType;
  content: string;
  sortOrder: number;
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  alt: string;
}

export interface Product {
  id: string;
  numIid: string;              // 淘宝商品Id
  categoryId: string;          // 类目id
  categoryName: string;        // 类目名称
  titleZh: string;
  titleEn: string;
  guideTitle: string;          // 导购标题
  skuSearchTitle: string;      // SKU搜索标题
  descriptionZh: string;
  descriptionEn: string;
  costPrice: number;           // 产品成本
  logisticsCost: number;      // 物流成本
  packagingCost: number;       // 打包成本
  platformCommission: number;  // 平台佣金
  sellingPrice: number | null; // 一口价
  merchantCode: string;       // 商家编码
  sizeSpec: string;           // 尺寸规格
  images: ProductImage[];
  contentBlocks: ContentBlock[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  numIid: string;
  categoryId: string;
  categoryName: string;
  titleZh: string;
  titleEn: string;
  guideTitle: string;
  skuSearchTitle: string;
  descriptionZh: string;
  descriptionEn: string;
  costPrice: number;
  logisticsCost: number;
  packagingCost: number;
  platformCommission: number;
  sellingPrice: number | null;
  merchantCode: string;
  sizeSpec: string;
  images: ProductImage[];
  contentBlocks: ContentBlock[];
  tags: string[];
}

export interface AITitleResult {
  titleZh: string;
  titleEn: string;
  guideTitle: string;
  skuSearchTitle: string;
  reason: string;
}

export interface AIPriceResult {
  suggestedPrice: number;
  profit: number;
  profitRate: number;
  reason: string;
}

// ============================================================
// 工具函数
// ============================================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyProduct(): Product {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    numIid: "",
    categoryId: "",
    categoryName: "",
    titleZh: "",
    titleEn: "",
    guideTitle: "",
    skuSearchTitle: "",
    descriptionZh: "",
    descriptionEn: "",
    costPrice: 0,
    logisticsCost: 0,
    packagingCost: 0,
    platformCommission: 0,
    sellingPrice: null,
    merchantCode: "",
    sizeSpec: "",
    images: [],
    contentBlocks: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function toProductInput(p: Product): ProductInput {
  return {
    numIid: p.numIid,
    categoryId: p.categoryId,
    categoryName: p.categoryName,
    titleZh: p.titleZh,
    titleEn: p.titleEn,
    guideTitle: p.guideTitle,
    skuSearchTitle: p.skuSearchTitle,
    descriptionZh: p.descriptionZh,
    descriptionEn: p.descriptionEn,
    costPrice: p.costPrice,
    logisticsCost: p.logisticsCost,
    packagingCost: p.packagingCost,
    platformCommission: p.platformCommission,
    sellingPrice: p.sellingPrice,
    merchantCode: p.merchantCode,
    sizeSpec: p.sizeSpec,
    images: p.images,
    contentBlocks: p.contentBlocks,
    tags: p.tags,
  };
}

export function calcProfit(cost: number, selling: number): number {
  return selling - cost;
}

export function calcProfitRate(cost: number, selling: number): number {
  if (selling === 0) return 0;
  return ((selling - cost) / selling) * 100;
}

export function calcTotalCost(p: Product): number {
  return p.costPrice + p.logisticsCost + p.packagingCost + p.platformCommission;
}

export function formatCurrency(amount: number, locale = "zh-CN"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: locale === "zh-CN" ? "CNY" : "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
