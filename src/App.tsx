import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import { Search, Plus, Sun, Moon, Settings, Key, Download, Upload, Sparkles, ClipboardCopy, ClipboardPaste, Trash2, Check } from "lucide-react";
import type { Product, TabId, AITitleResult, AIPriceResult, ProductInput } from "./types";
import {
  createEmptyProduct, generateId, toProductInput,
  calcProfitRate, calcTotalCost, formatCurrency, formatPercent,
} from "./types";
import { PricingTab, TagsTab } from "./components/TabComponents";
import { DescTab } from "./components/DescTab";
import { WorkbuddyExportButton } from "./components/WorkbuddyExport";
import { PromptOrbit } from "./features/orbit/PromptOrbit";

// Mock data
const mockProducts: Product[] = [
  {
    id: "mock-1", numIid: "1042132928249", categoryId: "50005026", categoryName: "数码影音>>耳机",
    titleZh: "无线蓝牙耳机 Pro", titleEn: "Wireless Bluetooth Earbuds Pro",
    guideTitle: "高品质降噪耳机，支持双设备连接",
    descriptionZh: "高品质降噪耳机，支持双设备连接",
    descriptionEn: "Premium noise-cancelling earbuds with dual-device support",
    costPrice: 85, logisticsCost: 8, packagingCost: 3, platformCommission: 19, sellingPrice: 199,
    merchantCode: "Earbuds-001",
    sizeSpec: "55mm x 55mm",
    images: [], contentBlocks: [],
    tags: ["数码", "音频", "蓝牙"],
    createdAt: "2026-04-01T10:00:00Z", updatedAt: "2026-04-01T10:00:00Z",
  },
];

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentTab, setCurrentTab] = useState<TabId>("basic");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [aiWorking, setAiWorking] = useState<{ loading: boolean; status: string; error?: string } | null>(null);
  const [showBatchExport, setShowBatchExport] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOrbit, setShowOrbit] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const data = await invoke<Product[]>("get_all_products");
      setProducts(data);
    } catch {
      setProducts(mockProducts);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) setIsDarkMode(saved === "true");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("darkMode", String(isDarkMode));
  }, [isDarkMode]);

  const filtered = products.filter((p) => {
    const matchSearch = !searchQuery ||
      p.titleZh.includes(searchQuery) ||
      p.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchTag = !filterTag || p.tags.includes(filterTag);
    return matchSearch && matchTag;
  });

  const allTags = Array.from(new Set(products.flatMap((p) => p.tags)));
  const selected = products.find((p) => p.id === selectedId);
  const selectedCount = selectedIds.size;
  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

  // 生成导出给 AI 的文本（全部或勾选产品）
  function buildExportText(targetProducts: Product[]): string {
    const lines: string[] = [];
    lines.push("你是跨境电商专家，请优化以下产品信息。");
    lines.push("");
    lines.push("【优化规则】");
    lines.push("- 中文标题（淘宝）：≤30字，融入高权重词：刺绣布贴、补丁贴、徽章、补洞神器、热熔胶可缝可烫、DIY辅料、国潮");
    lines.push("- 英文标题（Etsy）：≤140字符，融入：Iron on patch, Embroidery patch, Anime patch, Kawaii, DIY gift");
    lines.push("- 导购标题（淘宝）：≤15字，突出卖点");
    lines.push("- 保持各产品的 id 字段不变（用于回写）");
    lines.push("");
    lines.push("【产品列表】");
    lines.push("");
    targetProducts.forEach((p, i) => {
      lines.push(`--- 产品 ${i + 1} ---`);
      lines.push(`id: ${p.id}`);
      lines.push(`当前中文标题: ${p.titleZh || "（未填写）"}`);
      lines.push(`当前英文标题: ${p.titleEn || "（未填写）"}`);
      lines.push(`当前导购标题: ${p.guideTitle || "（未填写）"}`);
      lines.push(`类目: ${p.categoryName || "刺绣布贴"}`);
      lines.push(`中文描述: ${p.descriptionZh || "（未填写）"}`);
      lines.push(`标签: ${p.tags.join(", ") || "（无）"}`);
      lines.push("");
    });
    lines.push("【输出格式】");
    lines.push("请严格返回以下 JSON 数组，不要添加任何说明文字：");
    lines.push("[");
    lines.push('  { "id": "产品id", "titleZh": "优化后中文标题", "titleEn": "优化后英文标题", "guideTitle": "导购标题", "reason": "优化说明" },');
    lines.push("  ...");
    lines.push("]");
    return lines.join("\n");
  }

  // 解析 AI 回复并批量更新产品
  async function applyBatchResult(jsonText: string): Promise<{ updated: number; errors: string[] }> {
    const start = jsonText.indexOf("[");
    const end = jsonText.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("未找到 JSON 数组，请确保 AI 回复包含 [...] 格式的内容");
    const arr = JSON.parse(jsonText.slice(start, end + 1)) as Array<{
      id: string; titleZh?: string; titleEn?: string; guideTitle?: string; reason?: string;
    }>;

    let updated = 0;
    const errors: string[] = [];
    const updatedProducts = [...products];

    for (const item of arr) {
      const idx = updatedProducts.findIndex((p) => p.id === item.id);
      if (idx === -1) { errors.push(`找不到 id=${item.id} 的产品`); continue; }
      const p = updatedProducts[idx];
      const next: Product = {
        ...p,
        titleZh: item.titleZh || p.titleZh,
        titleEn: item.titleEn || p.titleEn,
        guideTitle: item.guideTitle || p.guideTitle,
        updatedAt: new Date().toISOString(),
      };
      updatedProducts[idx] = next;
      try {
        await invoke("update_product", { product: next });
        updated++;
      } catch (e: any) {
        errors.push(`${p.titleZh || p.id}: 保存失败 - ${e}`);
      }
    }
    setProducts(updatedProducts);
    return { updated, errors };
  }

  function getAiConfig() {
    const saved = JSON.parse(localStorage.getItem("aiConfig") || '{}');
    return { apiKey: saved.apiKey || "", baseUrl: saved.baseUrl || "https://api.minimax.chat/v1", model: saved.model || "MiniMax-M2.7" };
  }

  async function runAiTask<T>(status: string, task: () => Promise<T>): Promise<T> {
    const cfg = getAiConfig();
    if (!cfg.apiKey) {
      setShowSettings(true);
      throw new Error("请先配置 AI API Key");
    }
    setAiWorking({ loading: true, status });
    try {
      const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
      const [result] = await Promise.all([task(), wait(800)]);
      setAiWorking(null);
      return result;
    } catch (e: any) {
      setAiWorking({ loading: false, status: "操作失败", error: e.toString() });
      throw e;
    }
  }

  async function aiTitle(info: string, zhInput: string = "", enInput: string = ""): Promise<AITitleResult> {
    return runAiTask("正在生成双语标题及市场关键词...", () => {
      const cfg = getAiConfig();
      return invoke<AITitleResult>("ai_generate_title", { 
        zhInput, enInput, info, apiKey: cfg.apiKey, baseUrl: cfg.baseUrl, model: cfg.model 
      });
    });
  }

  async function aiGuideTitle(title: string, desc: string, tags: string[]): Promise<String> {
    return runAiTask("正在生成创意导购标题...", () => {
      const cfg = getAiConfig();
      return invoke<string>("ai_generate_guide_title", { 
        title, desc, tags, apiKey: cfg.apiKey, baseUrl: cfg.baseUrl, model: cfg.model 
      });
    });
  }

  async function aiSkuTitle(title: string, desc: string, tags: string[]): Promise<String> {
    return runAiTask("正在生成 SKU 搜索标题...", () => {
      const cfg = getAiConfig();
      return invoke<string>("ai_generate_sku_title", { 
        title, desc, tags, apiKey: cfg.apiKey, baseUrl: cfg.baseUrl, model: cfg.model 
      });
    });
  }

  async function aiPrice(cost: number, info: string): Promise<AIPriceResult> {
    return runAiTask("正在根据成本建议市场定价...", async () => {
      const cfg = getAiConfig();
      try {
        return await invoke<AIPriceResult>("ai_suggest_price", { cost, info, apiKey: cfg.apiKey, baseUrl: cfg.baseUrl, model: cfg.model });
      } catch {
        const s = cost * 3;
        return { suggestedPrice: s, profit: s - cost, profitRate: calcProfitRate(cost, s), reason: "3x 成本系数估算" };
      }
    });
  }

  async function aiDesc(product: Product, lang: "zh" | "en" | "both") {
    return runAiTask("正在生成产品详情描述文案...", async () => {
      const cfg = getAiConfig();
      const input = toProductInput(product);
      return await invoke<{ zh?: string; en?: string }>("ai_generate_description", { 
        product: input, lang, apiKey: cfg.apiKey, baseUrl: cfg.baseUrl, model: cfg.model 
      });
    });
  }

  async function aiSize(images: any[]) {
    return runAiTask("正在从图片中分析尺寸规格...", async () => {
      const cfg = getAiConfig();
      return await invoke<string>("ai_extract_size", { 
        images, apiKey: cfg.apiKey, baseUrl: cfg.baseUrl, model: cfg.model 
      });
    });
  }

  async function handleCreate() {
    const empty = createEmptyProduct();
    try {
      const created = await invoke<Product>("create_product", { data: toProductInput(empty) });
      setProducts([created, ...products]);
      setSelectedId(created.id);
      setCurrentTab("basic");
    } catch (err) {
      console.error("创建失败:", err);
    }
  }

  async function handleUpdate(updated: Product) {
    setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
    try {
      await invoke("update_product", { product: updated });
    } catch (err) {
      console.error("保存失败:", err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await invoke("delete_product", { id });
      setProducts(products.filter((p) => p.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      console.error("删除失败:", err);
    }
  }

  const executeDelete = async () => {
    const ids = Array.from(selectedIds);
    console.log("=== 开始批量删除 ===");
    console.log("要删除的 IDs:", ids);
    console.log("IDs 数量:", ids.length);
    console.log("当前产品总数:", products.length);
    
    if (ids.length === 0) {
      window.alert("没有选中任何产品");
      return;
    }

    setIsDeleting(true);
    
    // 先从本地状态中立即移除，确保 UI 反应快速
    const deleteSet = new Set(ids);
    const remainingProducts = products.filter(p => !deleteSet.has(p.id));
    console.log("过滤后剩余产品数:", remainingProducts.length);
    
    try {
      // 尝试批量删除
      console.log("调用 delete_products...");
      const deletedCount = await invoke<number>("delete_products", { ids });
      console.log("后端返回删除数量:", deletedCount);
      
      // 更新本地状态
      setProducts(remainingProducts);
      setSelectedIds(new Set());
      setConfirmDelete(false);
      
      if (selectedId && deleteSet.has(selectedId)) {
        setSelectedId(null);
      }
      
      // 尝试重新加载验证
      try {
        const freshData = await invoke<Product[]>("get_all_products");
        console.log("重新加载后产品数:", freshData.length);
        setProducts(freshData);
      } catch (reloadErr) {
        console.warn("重新加载失败，使用本地状态:", reloadErr);
        // 已经用 remainingProducts 更新了，不需要额外处理
      }
      
      window.alert(`成功删除 ${deletedCount} 个产品`);
    } catch (err) {
      console.error("批量删除失败:", err);
      
      // 尝试逐个删除
      console.log("尝试逐个删除...");
      let successCount = 0;
      const failedIds: string[] = [];
      
      for (const id of ids) {
        try {
          await invoke("delete_product", { id });
          successCount++;
          console.log("成功删除:", id);
        } catch (e) {
          console.error("删除失败:", id, e);
          failedIds.push(id);
        }
      }
      
      console.log("逐个删除结果: 成功", successCount, "失败", failedIds.length);
      
      // 更新本地状态（只移除成功删除的）
      const successIds = ids.filter(id => !failedIds.includes(id));
      const successDeleteSet = new Set(successIds);
      setProducts(prev => prev.filter(p => !successDeleteSet.has(p.id)));
      setSelectedIds(new Set());
      setConfirmDelete(false);
      
      if (successCount > 0) {
        window.alert(`已删除 ${successCount} 个产品${failedIds.length > 0 ? `，${failedIds.length} 个失败` : ''}`);
      } else {
        window.alert(`全部删除失败: ${String(err)}\n失败的 IDs: ${failedIds.join(', ')}`);
      }
    } finally {
      setIsDeleting(false);
      console.log("=== 删除操作结束 ===");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-dark-bg text-text-primary overflow-hidden">
      {aiWorking && <AIOverlay data={aiWorking} onClose={() => setAiWorking(null)} />}
      
      <header className="h-14 px-4 border-b border-dark-border flex items-center justify-between bg-dark-surface shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Key className="w-5 h-5 text-dark-bg" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">金钥匙 <span className="text-primary">Golden Key</span></h1>
        </div>

        <div className="flex items-center gap-3">
          <WorkbuddyExportButton products={products} selectedIds={selectedIds} />
          <div className="h-4 w-px bg-dark-border mx-1"></div>
          <button
            onClick={() => setShowOrbit(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium transition-colors"
            title="AI 提示词轨道 - 专家协作系统"
          >
            <Sparkles className="w-4 h-4" />
            Prompt Orbit
          </button>
          <div className="h-4 w-px bg-dark-border mx-1"></div>
          <button
            onClick={() => setShowBatchExport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
            title="导出产品信息给 AI 优化"
          >
            <Download className={`w-4 h-4 ${selectedCount > 0 ? "animate-pulse" : ""}`} />
            {selectedCount > 0 ? `批量导出 (${selectedCount})` : "批量导出"}
          </button>
          <button
            onClick={() => setShowBatchImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-bg hover:bg-dark-border text-text-muted hover:text-text-primary rounded-lg text-sm font-medium transition-colors border border-dark-border"
            title="导入 AI 优化后的 JSON 数据"
          >
            <Upload className="w-4 h-4" />
            批量导入
          </button>
          <div className="h-4 w-px bg-dark-border mx-1"></div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-text-muted">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-text-muted">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-dark-border flex flex-col bg-dark-bg shrink-0">
          <div className="p-4 flex gap-2">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="text" placeholder="搜索产品..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input w-full pl-9 text-sm h-10" />
            </div>
            <button onClick={handleCreate} className="btn-primary w-10 h-10 p-0 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto scrollbar-none scroll-smooth">
            <button onClick={() => setFilterTag(null)} className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap border ${!filterTag ? "bg-primary text-dark-bg border-primary" : "bg-dark-surface text-text-muted border-dark-border"}`}>全部</button>
            {allTags.map((tag) => (
              <button key={tag} onClick={() => setFilterTag(tag === filterTag ? null : tag)} className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap border ${tag === filterTag ? "bg-primary text-dark-bg border-primary" : "bg-dark-surface text-text-muted border-dark-border"}`}>{tag}</button>
            ))}
          </div>

          <div className="px-4 py-2.5 border-b border-dark-border bg-dark-bg/50 flex items-center gap-4">
            {/* 全选 checkbox - label 只包裹 checkbox */}
            <label className="flex items-center gap-2 cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={allSelected} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelectedIds((prev) => {
                    const next = new Set(prev);
                    filtered.forEach((p) => { checked ? next.add(p.id) : next.delete(p.id); });
                    return next;
                  });
                }} 
                className="w-4 h-4 rounded accent-primary cursor-pointer" 
              />
              <span className="text-[11px] font-medium text-text-muted select-none">全选 ({filtered.length})</span>
            </label>
            
            {/* 删除区域 - 完全独立，远离 label */}
            {selectedCount > 0 && (
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded">已选 {selectedCount}</span>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setSelectedIds(new Set()); }}
                  className="text-[10px] text-text-muted hover:text-text-primary"
                >
                  取消选择
                </button>
                
                {/* 删除确认 */}
                {confirmDelete ? (
                  <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-lg border border-red-500/40">
                    <span className="text-[10px] text-red-400 font-bold">确认删除全部?</span>
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); executeDelete(); }}
                      disabled={isDeleting}
                      className="text-[10px] bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-bold disabled:opacity-50 transition-colors"
                    >
                      {isDeleting ? "删除中..." : "确认删除"}
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); setConfirmDelete(false); }}
                      disabled={isDeleting}
                      className="text-[10px] text-text-muted hover:text-text-primary px-2 disabled:opacity-50"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(true); }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 transition-all border border-red-500/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除所选
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? <div className="p-4 text-center text-text-muted">加载中...</div> : filtered.map((p) => (
              <ProductCard key={p.id} product={p} isSelected={p.id === selectedId} isChecked={selectedIds.has(p.id)} onSelect={(id: string, checked: boolean) => {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  checked ? next.add(id) : next.delete(id);
                  return next;
                });
              }} onClick={() => setSelectedId(p.id)} />
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-hidden">
          {selected ? (
            <ProductEditor
              product={selected} tab={currentTab} onTab={setCurrentTab}
              onUpdate={handleUpdate} onDelete={handleDelete}
              onAITitle={aiTitle} onAIGuide={aiGuideTitle} onAISku={aiSkuTitle} onAIPrice={aiPrice} onAIDesc={aiDesc} onAISize={aiSize} allTags={allTags}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
              <Key className="w-16 h-16 mb-4 text-text-muted" />
              <h2 className="text-xl font-medium mb-2">欢迎使用金钥匙</h2>
              <p className="text-sm text-text-muted">请从侧边栏选择一个产品或创建一个新产品</p>
            </div>
          )}
        </main>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} aiTitle={aiTitle} aiPrice={aiPrice} aiDesc={aiDesc} />}
      {showBatchExport && <BatchExportModal products={products} selectedIds={selectedIds} buildExportText={buildExportText} onClose={() => setShowBatchExport(false)} onImport={() => { setShowBatchExport(false); setShowBatchImport(true); }} />}
      {showBatchImport && <BatchImportModal onClose={() => setShowBatchImport(false)} onApply={applyBatchResult} />}
      
      {showOrbit && (
        <div className="fixed inset-0 z-[60]">
          <PromptOrbit onClose={() => setShowOrbit(false)} />
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, isSelected, isChecked, onSelect, onClick }: any) {
  const img = product.images.find((i: any) => i.isPrimary) ?? product.images[0];
  const rate = product.sellingPrice ? calcProfitRate(calcTotalCost(product), product.sellingPrice) : null;
  return (
    <div className={`w-full p-3 rounded-lg mb-1 transition-all flex items-start gap-2 cursor-pointer ${isSelected ? "bg-[#2D3139] border border-[#F5A623]" : "hover:bg-[#1C1F27] border border-transparent"}`} onClick={onClick}>
      <input type="checkbox" checked={isChecked} onChange={(e) => { e.stopPropagation(); onSelect(product.id, e.target.checked); }} onClick={(e) => e.stopPropagation()} className="w-4 h-4 accent-primary mt-1 shrink-0" />
      <div className="w-12 h-12 rounded-lg bg-dark-bg border border-dark-border overflow-hidden shrink-0 flex items-center justify-center">
        {img ? <img src={img.url} alt="" className="w-full h-full object-cover" /> : <Key className="w-5 h-5 text-text-muted" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.titleZh || "未命名"}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-mono text-text-muted">{formatCurrency(product.sellingPrice || 0)}</span>
          {rate !== null && <span className={`text-xs font-medium ${rate >= 30 ? "text-green-400" : "text-yellow-400"}`}>{formatPercent(rate)}</span>}
        </div>
      </div>
    </div>
  );
}

function ProductEditor({ product, tab, onTab, onUpdate, onDelete, onAITitle, onAIGuide, onAISku, onAIPrice, onAIDesc, onAISize, allTags }: any) {
  const [local, setLocal] = useState<Product>(product);
  const [showDelete, setShowDelete] = useState(false);
  useEffect(() => { setLocal(product); }, [product]);
  const handleUpdate = (patch: Partial<Product>) => {
    const next = { ...local, ...patch, updatedAt: new Date().toISOString() };
    setLocal(next);
    onUpdate(next);
  };
  return (
    <div className="h-full flex flex-col bg-dark-surface">
      <div className="h-12 border-b border-dark-border flex items-center px-4 bg-dark-bg shrink-0">
        <div className="flex-1 flex items-center gap-1 overflow-hidden mr-4">
          <Key className="w-4 h-4 text-primary shrink-0" />
          <h2 className="font-semibold text-sm truncate">{local.titleZh || "未命名产品"}</h2>
        </div>
        <button onClick={() => setShowDelete(true)} className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1">删除</button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-1 border-b border-dark-border mb-6">
          <button onClick={() => onTab("basic")} className={`px-4 py-2 text-sm font-medium transition-all ${tab === "basic" ? "text-primary border-b-2 border-primary" : "text-text-muted hover:text-text-primary"}`}>基本信息</button>
          <button onClick={() => onTab("pricing")} className={`px-4 py-2 text-sm font-medium transition-all ${tab === "pricing" ? "text-primary border-b-2 border-primary" : "text-text-muted hover:text-text-primary"}`}>价格与利润</button>
          <button onClick={() => onTab("images")} className={`px-4 py-2 text-sm font-medium transition-all ${tab === "images" ? "text-primary border-b-2 border-primary" : "text-text-muted hover:text-text-primary"}`}>产品图片</button>
          <button onClick={() => onTab("desc")} className={`px-4 py-2 text-sm font-medium transition-all ${tab === "desc" ? "text-primary border-b-2 border-primary" : "text-text-muted hover:text-text-primary"}`}>详情文案</button>
        </div>
        {tab === "basic" && <BasicTab product={local} onUpdate={handleUpdate} onAITitle={onAITitle} onAIGuide={onAIGuide} onAISku={onAISku} onAISize={onAISize} allTags={allTags} />}
        {tab === "pricing" && <PricingTab product={local} onUpdate={handleUpdate} onAIPrice={onAIPrice} />}
        {tab === "images" && <ImageTab product={local} onUpdate={handleUpdate} />}
        {tab === "desc" && <DescTab product={local} onUpdate={handleUpdate} onAIDesc={onAIDesc} />}
      </div>
      {showDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
          <div className="bg-dark-surface p-6 rounded-2xl border border-dark-border max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold">确定删除产品？</h3>
            <p className="text-sm text-text-muted">删除后数据无法恢复，请谨慎操作。</p>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 rounded-lg text-sm bg-dark-border hover:bg-dark-bg transition-colors">取消</button>
              <button onClick={() => { onDelete(local.id); setShowDelete(false); }} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BasicTab({ product, onUpdate, onAITitle, onAIGuide, onAISku, onAISize, allTags }: any) {
  const [loading, setLoading] = useState(false);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [loadingSku, setLoadingSku] = useState(false);
  const [loadingSize, setLoadingSize] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 bg-dark-surface border border-dark-border rounded-xl p-4">
        <div><label className="block text-xs text-text-muted mb-1.5">商品Id</label><input type="text" value={product.numIid} onChange={(e) => onUpdate({ numIid: e.target.value })} className="input w-full text-sm font-mono" /></div>
        <div><label className="block text-xs text-text-muted mb-1.5">商家编码</label><input type="text" value={product.merchantCode} onChange={(e) => onUpdate({ merchantCode: e.target.value })} className="input w-full text-sm font-mono" /></div>
        <div className="col-span-2">
          <label className="block text-xs text-text-muted mb-1.5">尺寸规格</label>
          <div className="flex gap-2">
            <input type="text" value={product.sizeSpec} onChange={(e) => onUpdate({ sizeSpec: e.target.value })} className="input flex-1 text-sm font-mono" />
            <button onClick={async () => {
              setLoadingSize(true);
              try {
                const r = await onAISize(product.images);
                onUpdate({ sizeSpec: r });
              } finally { setLoadingSize(false); }
            }} disabled={loadingSize || product.images.length === 0} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold hover:bg-primary/20 disabled:opacity-50 flex items-center gap-1">
              {loadingSize ? <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
              识别尺寸
            </button>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">中文标题 (淘宝)</label>
            <button onClick={async () => {
              setLoading(true);
              try {
                const info = [product.descriptionZh, ...product.tags].join(" ");
                const r = await onAITitle(info, product.titleZh, product.titleEn);
                onUpdate({ titleZh: r.titleZh, titleEn: r.titleEn, guideTitle: r.guideTitle, skuSearchTitle: r.skuSearchTitle });
              } finally { setLoading(false); }
            }} disabled={loading} className="text-primary text-xs hover:underline flex items-center gap-1">
              {loading ? <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
              AI 优化标题
            </button>
          </div>
          <input type="text" value={product.titleZh} onChange={(e) => onUpdate({ titleZh: e.target.value })} className="input w-full" />
        </div>
        <div><label className="block text-sm font-medium mb-1.5">Product Title (EN)</label><input type="text" value={product.titleEn} onChange={(e) => onUpdate({ titleEn: e.target.value })} className="input w-full" /></div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">导购标题</label>
              <button onClick={async () => {
                setLoadingGuide(true);
                try {
                  const r = await onAIGuide(product.titleZh, product.descriptionZh, product.tags);
                  onUpdate({ guideTitle: r });
                } finally { setLoadingGuide(false); }
              }} disabled={loadingGuide} className="text-primary text-xs hover:underline flex items-center gap-1">
                {loadingGuide ? <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI 生成
              </button>
            </div>
            <div className="relative">
              <input type="text" value={product.guideTitle} onChange={(e) => onUpdate({ guideTitle: e.target.value })} className="input w-full" maxLength={15} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted">
                {product.guideTitle.length}/15
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">SKU搜索标题</label>
              <button onClick={async () => {
                setLoadingSku(true);
                try {
                  const r = await onAISku(product.titleZh, product.descriptionZh, product.tags);
                  onUpdate({ skuSearchTitle: r });
                } finally { setLoadingSku(false); }
              }} disabled={loadingSku} className="text-primary text-xs hover:underline flex items-center gap-1">
                {loadingSku ? <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI 生成
              </button>
            </div>
            <div className="relative">
              <input type="text" value={product.skuSearchTitle} onChange={(e) => onUpdate({ skuSearchTitle: e.target.value })} className="input w-full" maxLength={15} minLength={10} />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${product.skuSearchTitle.length < 10 ? 'text-red-400' : 'text-text-muted'}`}>
                {product.skuSearchTitle.length}/15
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-dark-surface border border-dark-border rounded-xl p-4 space-y-4">
        <h3 className="font-medium text-sm">🏷️ 商品标签</h3>
        <div className="flex flex-wrap gap-2 items-center">
          {product.tags.map((tag: string) => (
            <span key={tag} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-lg border border-primary/20 flex items-center gap-1.5">
              {tag}
              <button onClick={() => onUpdate({ tags: product.tags.filter((t: string) => t !== tag) })} className="opacity-50 hover:opacity-100 hover:text-red-400">×</button>
            </span>
          ))}
          <input type="text" placeholder="添加标签..." className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1 text-xs outline-none focus:border-primary/50 w-24" onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = e.currentTarget.value.trim();
              if (val && !product.tags.includes(val)) {
                onUpdate({ tags: [...product.tags, val] });
                e.currentTarget.value = '';
              }
            }
          }} />
        </div>
        {allTags && allTags.filter((t: string) => !product.tags.includes(t)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[10px] text-text-muted mr-1 self-center">推荐:</span>
            {allTags.filter((t: string) => !product.tags.includes(t)).slice(0, 5).map((tag: string) => (
              <button key={tag} onClick={() => onUpdate({ tags: [...product.tags, tag] })} className="text-[10px] px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-text-muted hover:border-primary/50">+ {tag}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ImageTab({ product, onUpdate }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-dark-border rounded-xl p-8 text-center bg-dark-bg/50">
        <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach(f => {
            const r = new FileReader();
            r.onload = (ev) => onUpdate({ images: [...product.images, { id: generateId(), url: ev.target?.result as string, isPrimary: product.images.length === 0, alt: f.name }] });
            r.readAsDataURL(f);
          });
        }} />
        <button onClick={() => fileInputRef.current?.click()} className="btn-primary px-6">上传本地图片</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {product.images.map((img: any) => (
          <div key={img.id} className="relative aspect-square rounded-lg border border-dark-border overflow-hidden group bg-dark-bg">
            <img src={img.url} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button onClick={() => onUpdate({ images: product.images.map((i: any) => ({ ...i, isPrimary: i.id === img.id })) })} className={`p-1.5 rounded-full ${img.isPrimary ? "bg-primary text-dark-bg" : "bg-dark-surface text-text-primary hover:bg-primary hover:text-dark-bg"}`} title="设为封面"><Sparkles className="w-3.5 h-3.5" /></button>
              <button onClick={() => onUpdate({ images: product.images.filter((i: any) => i.id !== img.id) })} className="p-1.5 rounded-full bg-dark-surface text-red-400 hover:bg-red-500 hover:text-white" title="删除"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            {img.isPrimary && <span className="absolute top-1 left-1 bg-primary text-dark-bg text-[10px] px-1.5 py-0.5 rounded font-bold">主图</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AIOverlay({ data, onClose }: any) {
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[100000] p-6" style={{ backgroundColor: "rgba(15, 17, 23, 0.95)", backdropFilter: "blur(8px)" }}>
      <div className="bg-[#1C1F27] border border-[#2D3139] rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6">
        {data.loading ? (
          <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-[#F5A623] opacity-20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div>
            <Key className="w-6 h-6 text-[#F5A623] animate-pulse" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500"><Settings className="w-8 h-8" /></div>
        )}
        <div>
          <h4 className="text-lg font-bold mb-1 text-[#E8EAED]">{data.loading ? "AI 深度思考中" : "AI 操作中断"}</h4>
          <p className="text-sm text-[#9AA0A6] whitespace-pre-wrap">{data.error || data.status}</p>
        </div>
        {!data.loading && <button onClick={onClose} className="w-full py-3 bg-[#F5A623] text-[#0F1117] hover:bg-[#E0961F] rounded-xl font-bold transition-all">确定并返回</button>}
      </div>
    </div>,
    document.body
  );
}

function BatchExportModal({ products, selectedIds, buildExportText, onClose, onImport }: any) {
  const target = selectedIds.size > 0 ? products.filter((p: any) => selectedIds.has(p.id)) : products;
  const text = buildExportText(target);
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-6">
      <div className="bg-[#1C1F27] border border-[#2D3139] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col p-6 space-y-4">
        <div className="flex items-center justify-between"><h3 className="text-lg font-bold">批量导出 AI 优化文本</h3><button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl">×</button></div>
        <p className="text-sm text-text-muted">已准备好 <span className="text-primary font-bold">{target.length}</span> 条商品数据。复制下方文本并发送给 AI（如 ChatGPT），它将按要求返回优化结果。</p>
        <textarea readOnly value={text} className="flex-1 bg-dark-bg border border-dark-border rounded-xl p-4 text-xs font-mono h-64 resize-none outline-none" />
        <div className="flex gap-3">
          <button onClick={onImport} className="flex-1 py-3 bg-dark-bg hover:bg-dark-border text-text-muted rounded-xl text-sm transition-colors border border-dark-border">已有 AI 回复 →</button>
          <button onClick={copy} className="flex-1 py-3 bg-primary text-dark-bg hover:bg-primary/90 rounded-xl font-bold flex items-center justify-center gap-2">{copied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />} {copied ? "已复制" : "复制全部文本"}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function BatchImportModal({ onClose, onApply }: any) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<any>({ type: "idle" });
  const handleApply = async () => {
    if (!text.trim()) return;
    setStatus({ type: "loading" });
    try {
      const result = await onApply(text);
      setStatus({ type: "success", updated: result.updated, errors: result.errors });
    } catch (e: any) { setStatus({ type: "error", msg: e.message || e.toString() }); }
  };
  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-6">
      <div className="bg-[#1C1F27] border border-[#2D3139] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-[#2D3139]"><h3 className="text-lg font-bold flex items-center gap-2"><ClipboardPaste className="w-5 h-5 text-primary" />AI 批量优化 — 导入回复</h3><button onClick={onClose} className="text-text-muted hover:text-text-primary text-2xl">×</button></div>
        <div className="flex-1 overflow-hidden p-5">
          {status.type === "success" ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 text-3xl">✅</div>
              <div><h4 className="text-lg font-bold">导入成功！</h4><p className="text-sm text-text-muted mt-1">已更新 <span className="text-green-400 font-bold">{status.updated}</span> 个产品的标题</p></div>
              <button onClick={onClose} className="bg-primary text-dark-bg px-8 py-3 rounded-xl font-bold hover:bg-primary/90">关闭</button>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-3">
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={'将 AI 的 JSON 数组回复粘贴到这里...'} className="flex-1 bg-dark-bg border border-dark-border rounded-xl p-4 text-sm font-mono resize-none outline-none" />
              {status.type === "error" && <div className="text-red-400 text-sm">❌ {status.msg}</div>}
            </div>
          )}
        </div>
        {status.type !== "success" && (
          <div className="flex gap-3 p-5 pt-0">
            <button onClick={onClose} className="px-5 py-3 bg-dark-bg hover:bg-dark-border text-text-muted rounded-xl transition-colors">取消</button>
            <button onClick={handleApply} disabled={!text.trim() || status.type === "loading"} className="flex-1 py-3 bg-primary text-dark-bg hover:bg-primary/90 rounded-xl font-bold disabled:opacity-50">{status.type === "loading" ? "更新中..." : "解析并更新产品"}</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function SettingsModal({ onClose }: any) {
  const [cfg, setCfg] = useState(() => JSON.parse(localStorage.getItem("aiConfig") || '{"apiKey":"","baseUrl":"https://api.minimax.chat/v1","model":"MiniMax-M2.7"}'));
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const save = () => { localStorage.setItem("aiConfig", JSON.stringify(cfg)); onClose(); };
  const test = async () => {
    setTestStatus("测试中...");
    try {
      await invoke("test_ai_connection", { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl, model: cfg.model });
      setTestStatus("✅ 连接成功");
    } catch (e: any) { setTestStatus(`❌ 失败: ${e}`); }
  };
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[2000] p-6">
      <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between mb-2"><h3 className="text-lg font-bold">AI 配置</h3><button onClick={onClose} className="text-text-muted hover:text-text-primary">×</button></div>
        <div className="space-y-3">
          <div><label className="block text-xs text-text-muted mb-1">Base URL</label><input type="text" value={cfg.baseUrl} onChange={(e) => setCfg({ ...cfg, baseUrl: e.target.value })} className="input w-full text-sm" /></div>
          <div><label className="block text-xs text-text-muted mb-1">API Key</label><input type="password" value={cfg.apiKey} onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })} className="input w-full text-sm font-mono" /></div>
          <div><label className="block text-xs text-text-muted mb-1">Model Name</label><input type="text" value={cfg.model} onChange={(e) => setCfg({ ...cfg, model: e.target.value })} className="input w-full text-sm" /></div>
        </div>
        <div className="pt-4 flex flex-col gap-3">
          <button onClick={test} className="btn-secondary w-full py-2.5 text-sm">{testStatus || "🧪 测试连接"}</button>
          <button onClick={save} className="btn-primary w-full py-2.5 font-bold">保存并应用</button>
        </div>
      </div>
    </div>
  );
}
