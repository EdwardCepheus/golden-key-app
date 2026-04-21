// ============================================================
// 金钥匙 × WorkBuddy React Hook
// ============================================================

import { useState, useCallback } from "react";
import type { Product } from "../../types";
import type { AnalysisType, ExportResult } from "./types";
import { quickExport } from "./exporter";
import { copyToClipboard, showCopyNotification } from "./clipboard";

interface UseWorkbuddyExportOptions {
  /** 自定义分析类型 */
  defaultAnalysisType?: AnalysisType;
}

interface UseWorkbuddyExportReturn {
  /** 导出状态 */
  isExporting: boolean;
  /** 最后一次导出结果 */
  lastResult: ExportResult | null;
  /** 通知消息 */
  notification: string | null;
  /** 导出并复制到剪贴板 */
  exportAndCopy: (products: Product[], analysisType?: AnalysisType) => Promise<string>;
  /** 清除通知 */
  clearNotification: () => void;
}

/**
 * WorkBuddy 导出 Hook
 */
export function useWorkbuddyExport(
  options: UseWorkbuddyExportOptions = {}
): UseWorkbuddyExportReturn {
  const { defaultAnalysisType = "full" } = options;

  const [isExporting, setIsExporting] = useState(false);
  const [lastResult, setLastResult] = useState<ExportResult | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const exportAndCopy = useCallback(
    async (products: Product[], analysisType: AnalysisType = defaultAnalysisType): Promise<string> => {
      if (products.length === 0) {
        const msg = "⚠️ 没有选中商品，请先选择要分析的商品";
        setNotification(msg);
        return msg;
      }

      setIsExporting(true);
      setNotification(null);

      try {
        // 生成导出内容
        const result = quickExport(products, analysisType);
        setLastResult(result);

        // 复制到剪贴板
        const copied = await copyToClipboard(result.content);

        // 显示通知
        const msg = showCopyNotification(copied, result.recordCount);
        setNotification(msg);

        return msg;
      } catch (error) {
        const msg = `❌ 导出失败: ${error}`;
        setNotification(msg);
        return msg;
      } finally {
        setIsExporting(false);
      }
    },
    [defaultAnalysisType]
  );

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    isExporting,
    lastResult,
    notification,
    exportAndCopy,
    clearNotification,
  };
}
