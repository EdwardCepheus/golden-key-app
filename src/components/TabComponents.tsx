import { useState } from "react";
import type { Product, AIPriceResult } from "../types";
import { calcProfit, calcProfitRate, calcTotalCost, formatCurrency, formatPercent } from "../types";

// 格式化数字：保留两位小数（显示用）
function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return "";
  return Number(v).toFixed(2);
}

// 解析输入字符串为数字（支持直接输小数点开头如 .27 → 0.27）
function parseNum(s: string): number {
  const cleaned = s.replace(/[^0-9.]/g, "");
  const f = parseFloat(cleaned);
  return isNaN(f) ? 0 : f;
}

// ============================================================
// Pricing Tab
// ============================================================

export function PricingTab({ product, onUpdate, onAIPrice }: {
  product: Product;
  onUpdate: (p: Partial<Product>) => void;
  onAIPrice: (cost: number, info: string) => Promise<AIPriceResult>;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIPriceResult | null>(null);
  // 受控输入状态：实时反映用户输入
  const [costPrice, setCostPrice] = useState(fmt(product.costPrice));
  const [logisticsCost, setLogisticsCost] = useState(fmt(product.logisticsCost));
  const [packagingCost, setPackagingCost] = useState(fmt(product.packagingCost));
  const [platformCommission, setPlatformCommission] = useState(fmt(product.platformCommission));
  const [sellingPrice, setSellingPrice] = useState(fmt(product.sellingPrice || 0));

  // 产品切换时同步状态（受控 input 必须用 key 触发重置）
  const totalCost = calcTotalCost(product);
  const selling = product.sellingPrice || 0;
  const profit = calcProfit(totalCost, selling);
  const rate = calcProfitRate(totalCost, selling);

  async function suggest() {
    if (!totalCost) return;
    setLoading(true);
    try {
      const r = await onAIPrice(totalCost, `${product.titleZh} ${product.descriptionZh}`);
      // 确保 returned price 有效，否则用 stub (totalCost * 3)
      const price = (r && r.suggestedPrice && r.suggestedPrice > 0) ? r.suggestedPrice : totalCost * 3;
      setResult(r ? { ...r, suggestedPrice: price } : null);
      onUpdate({ sellingPrice: price });
    } catch (e) {
      // 调用失败时用 stub
      const stubPrice = totalCost * 3;
      const stubResult = {
        suggestedPrice: stubPrice,
        profit: stubPrice - totalCost,
        profitRate: ((stubPrice - totalCost) / stubPrice) * 100,
        reason: "基于 3x 成本系数的市场参考定价",
      };
      setResult(stubResult);
      onUpdate({ sellingPrice: stubPrice });
    } finally { setLoading(false); }
  }

  function updateCost(field: "costPrice" | "logisticsCost" | "packagingCost" | "platformCommission", value: number) {
    onUpdate({ [field]: value });
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* AI 推荐 */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm mb-1">✨ AI 推荐售价</h3>
            <p className="text-xs text-text-muted">基于总成本和市场竞争智能定价</p>
          </div>
          <button onClick={suggest} disabled={loading || !totalCost} className="btn-ai text-sm flex items-center gap-2 shrink-0">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />分析中</>
            ) : (
              <>✨ AI 推荐</>
            )}
          </button>
        </div>
      </div>

      {/* 成本明细 */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-4 space-y-4">
        <h3 className="font-medium text-sm">成本明细</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">💰 产品成本 (元)</label>
            <input
              key={product.id + "-cost"}
              type="text" inputMode="decimal"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              onBlur={() => onUpdate({ costPrice: parseNum(costPrice) })}
              placeholder="0.00" className="input w-full font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">🚚 物流成本 (元)</label>
            <input
              key={product.id + "-logistics"}
              type="text" inputMode="decimal"
              value={logisticsCost}
              onChange={(e) => setLogisticsCost(e.target.value)}
              onBlur={() => onUpdate({ logisticsCost: parseNum(logisticsCost) })}
              placeholder="0.00" className="input w-full font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">📦 打包成本 (元)</label>
            <input
              key={product.id + "-packaging"}
              type="text" inputMode="decimal"
              value={packagingCost}
              onChange={(e) => setPackagingCost(e.target.value)}
              onBlur={() => onUpdate({ packagingCost: parseNum(packagingCost) })}
              placeholder="0.00" className="input w-full font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">🏪 平台佣金 (元)</label>
            <input
              key={product.id + "-commission"}
              type="text" inputMode="decimal"
              value={platformCommission}
              onChange={(e) => setPlatformCommission(e.target.value)}
              onBlur={() => onUpdate({ platformCommission: parseNum(platformCommission) })}
              placeholder="0.00" className="input w-full font-mono"
            />
          </div>
        </div>

        {/* 总成本 */}
        <div className="flex items-center justify-between pt-3 border-t border-dark-border">
          <span className="text-sm font-medium">总成本</span>
          <span className="text-lg font-mono font-bold text-primary">{formatCurrency(totalCost)}</span>
        </div>
      </div>

      {/* 销售价 */}
      <div>
        <label className="block text-sm font-medium mb-1.5">🏷️ 销售价 (元)</label>
        <input
          key={product.id + "-selling"}
          type="text" inputMode="decimal"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
          onBlur={() => onUpdate({ sellingPrice: parseNum(sellingPrice) })}
          placeholder="0.00" className="input w-48 font-mono text-lg"
        />
      </div>

      {/* 利润分析 */}
      {selling > 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-medium">利润分析</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-text-muted mb-1">利润额</p>
              <p className={`text-lg font-mono font-semibold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {formatCurrency(profit)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-muted mb-1">利润率</p>
              <p className={`text-lg font-mono font-semibold ${rate >= 20 ? "text-green-400" : rate >= 10 ? "text-yellow-400" : "text-red-400"}`}>
                {formatPercent(rate)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-muted mb-1">销售价</p>
              <p className="text-lg font-mono font-semibold">{formatCurrency(selling)}</p>
            </div>
          </div>

          {/* 可视化占比条 */}
          <div className="mt-3">
            <div className="h-3 rounded-full bg-dark-bg overflow-hidden flex">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${totalCost > 0 ? Math.min((totalCost / selling) * 100, 100) : 0}%` }}
              />
              <div
                className="bg-green-400 h-full transition-all"
                style={{ width: `${totalCost > 0 ? Math.max((profit / selling) * 100, 0) : 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-text-muted">成本 {totalCost > 0 ? formatPercent((totalCost / selling) * 100) : "0%"}</span>
              <span className="text-xs text-text-muted">利润 {formatPercent(rate)}</span>
            </div>
          </div>
        </div>
      )}

      {/* AI 定价理由 */}
      {result && (
        <div className="bg-dark-surface border border-primary/30 rounded-xl p-4">
          <h4 className="text-sm font-medium mb-2">💡 AI 定价理由</h4>
          <p className="text-sm text-text-muted">{result.reason}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tags Tab
// ============================================================

export function TagsTab({ product, onUpdate, allTags }: {
  product: Product;
  onUpdate: (p: Partial<Product>) => void;
  allTags: string[];
}) {
  const [newTag, setNewTag] = useState("");

  function addTag() {
    const tag = newTag.trim();
    if (!tag || product.tags.includes(tag)) return;
    onUpdate({ tags: [...product.tags, tag] });
    setNewTag("");
  }

  function removeTag(tag: string) {
    onUpdate({ tags: product.tags.filter((t) => t !== tag) });
  }

  function addSuggestedTag(tag: string) {
    if (product.tags.includes(tag)) return;
    onUpdate({ tags: [...product.tags, tag] });
  }

  const suggestions = allTags.filter((t) => !product.tags.includes(t));

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1.5">添加标签</label>
        <div className="flex gap-2">
          <input
            type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTag(); }}
            placeholder="输入标签名称后回车" className="input flex-1"
          />
          <button onClick={addTag} className="btn-primary text-sm">添加</button>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div>
          <p className="text-xs text-text-muted mb-2">推荐标签（从所有产品中）</p>
          <div className="flex flex-wrap gap-1">
            {suggestions.map((tag) => (
              <button
                key={tag}
                onClick={() => addSuggestedTag(tag)}
                className="text-xs px-2 py-0.5 rounded bg-dark-border text-text-muted hover:text-text-primary hover:bg-primary/20 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-medium mb-2">当前标签</p>
        {product.tags.length === 0 ? (
          <p className="text-sm text-text-muted">暂无标签</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-sm"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-400 transition-colors text-base leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
