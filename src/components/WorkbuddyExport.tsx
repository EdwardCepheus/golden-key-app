// ============================================================
// 金钥匙 × WorkBuddy 导出按钮组件
// ============================================================

import { useState } from "react";
import { Sparkles, X, Check, Loader2 } from "lucide-react";
import type { Product } from "../types";
import type { AnalysisType } from "../features/workbuddy/types";
import { useWorkbuddyExport, getAnalysisTypeName } from "../features/workbuddy";

interface WorkbuddyExportButtonProps {
  products: Product[];
  selectedIds: Set<string>;
}

const ANALYSIS_TYPES: { type: AnalysisType; name: string; desc: string }[] = [
  { type: "full", name: "📊 全面分析", desc: "综合所有维度，给出完整报告" },
  { type: "profit", name: "💰 利润分析", desc: "深度分析利润结构和优化空间" },
  { type: "trend", name: "📈 趋势分析", desc: "分析销量趋势，预测未来走向" },
  { type: "comparison", name: "⚖️ 竞品分析", desc: "对标竞争对手，分析竞争优势" },
  { type: "anomaly", name: "🔍 异常检测", desc: "发现数据中的异常和潜在问题" },
];

export function WorkbuddyExportButton({ products, selectedIds }: WorkbuddyExportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<AnalysisType>("full");
  
  const { isExporting, exportAndCopy, notification, clearNotification } = useWorkbuddyExport();

  // 确定要导出的商品
  const productsToExport = selectedIds.size > 0
    ? products.filter((p) => selectedIds.has(p.id))
    : products;

  const handleExport = async () => {
    await exportAndCopy(productsToExport, selectedType);
  };

  if (!showModal) {
    return (
      <button
        onClick={() => setShowModal(true)}
        disabled={products.length === 0}
        className="btn-secondary flex items-center gap-1.5 text-sm relative overflow-hidden group"
        title="发送到 Agent 进行 AI 分析"
      >
        <Sparkles className="w-4 h-4 text-yellow-400" />
        <span>AI 分析</span>
        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => { setShowModal(false); clearNotification(); }}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-dark-surface border border-dark-border rounded-xl shadow-2xl z-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border bg-dark-bg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="font-semibold">AI 数据分析</span>
          </div>
          <button
            onClick={() => { setShowModal(false); clearNotification(); }}
            className="p-1 rounded hover:bg-dark-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Data summary */}
          <div className="text-sm text-text-muted">
            将导出 <span className="text-text-primary font-medium">{productsToExport.length}</span> 个商品到 Agent 进行分析
          </div>

          {/* Analysis type selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">选择分析类型</label>
            <div className="grid grid-cols-1 gap-2">
              {ANALYSIS_TYPES.map(({ type, name, desc }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedType === type
                      ? "border-primary bg-primary/10"
                      : "border-dark-border hover:border-primary/50 hover:bg-dark-border/50"
                  }`}
                >
                  <div className="font-medium text-sm">{name}</div>
                  <div className="text-xs text-text-muted mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notification */}
          {notification && (
            <div className={`p-3 rounded-lg text-sm ${
              notification.includes("✅")
                ? "bg-green-500/10 text-green-400 border border-green-500/30"
                : "bg-red-500/10 text-red-400 border border-red-500/30"
            }`}>
              <div className="flex items-start gap-2">
                {notification.includes("✅") ? (
                  <Check className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <X className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span className="whitespace-pre-line">{notification}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-dark-border bg-dark-bg flex items-center justify-end gap-2">
          <button
            onClick={() => { setShowModal(false); clearNotification(); }}
            className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || productsToExport.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                复制并分析
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
