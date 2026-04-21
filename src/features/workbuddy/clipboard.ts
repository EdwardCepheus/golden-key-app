// ============================================================
// 金钥匙 × WorkBuddy 剪贴板操作
// ============================================================

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    console.error("复制到剪贴板失败:", error);
    return false;
  }
}

/**
 * 从剪贴板读取文本
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      return await navigator.clipboard.readText();
    }
    return null;
  } catch (error) {
    console.error("从剪贴板读取失败:", error);
    return null;
  }
}

/**
 * 复制后显示提示
 */
export function showCopyNotification(copied: boolean, recordCount: number): string {
  if (copied) {
    return `✅ 已复制到剪贴板！\n\n共 ${recordCount} 条商品数据\n\n现在去 Agent 粘贴分析吧 🚀`;
  }
  return "❌ 复制失败，请重试";
}
