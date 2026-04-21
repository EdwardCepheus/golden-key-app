import { useState } from "react";
import { Sparkles, Languages, Info, Copy, Check } from "lucide-react";
import type { Product } from "../types";
import { RichEditor } from "./RichEditor";

export function DescTab({ product, onUpdate, onAIDesc }: {
  product: Product;
  onUpdate: (p: Partial<Product>) => void;
  onAIDesc: (p: Product, lang: "zh" | "en" | "both") => Promise<{ zh?: string; en?: string }>;
}) {
  const [loadingZh, setLoadingZh] = useState(false);
  const [loadingEn, setLoadingEn] = useState(false);
  const [loadingBoth, setLoadingBoth] = useState(false);
  const [copiedZh, setCopiedZh] = useState(false);
  const [copiedEn, setCopiedEn] = useState(false);

  async function generate(lang: "zh" | "en" | "both") {
    if (lang === "zh") setLoadingZh(true);
    if (lang === "en") setLoadingEn(true);
    if (lang === "both") setLoadingBoth(true);
    
    try {
      const r = await onAIDesc(product, lang);
      const patch: Partial<Product> = {};
      if (r.zh) patch.descriptionZh = r.zh;
      if (r.en) patch.descriptionEn = r.en;
      onUpdate(patch);
    } finally {
      setLoadingZh(false);
      setLoadingEn(false);
      setLoadingBoth(false);
    }
  }

  const copyToClipboard = async (html: string, type: 'zh' | 'en') => {
    // Convert HTML to plain text: <p> -> \n, <br> -> \n, then strip other tags
    const tmp = document.createElement('div');
    tmp.innerHTML = html.replace(/<\/p>/g, '\n').replace(/<br\s*\/?>/g, '\n');
    const text = tmp.textContent || tmp.innerText || "";
    
    try {
      await navigator.clipboard.writeText(text.trim());
      if (type === 'zh') {
        setCopiedZh(true);
        setTimeout(() => setCopiedZh(false), 2000);
      } else {
        setCopiedEn(true);
        setTimeout(() => setCopiedEn(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex items-center justify-between gap-4 bg-dark-surface p-4 rounded-xl border border-dark-border">
        <div className="flex items-center gap-2 text-text-muted">
          <Info className="w-4 h-4 text-primary" />
          <p className="text-xs">支持富文本编辑，中英文对照排版。</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => generate("both")} 
            disabled={loadingBoth || loadingZh || loadingEn}
            className="btn-ai text-sm flex items-center gap-2"
          >
            {loadingBoth ? <LoadingSpinner /> : <Languages className="w-4 h-4" />}
            AI 生成双语
          </button>
        </div>
      </div>

      {/* 左右对照布局 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 中文编辑器 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span className="w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-[10px]">ZH</span>
              中文详情文案
            </h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => copyToClipboard(product.descriptionZh, 'zh')}
                className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${copiedZh ? 'text-green-400 bg-green-400/10' : 'text-text-muted hover:text-primary hover:bg-primary/10'}`}
              >
                {copiedZh ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedZh ? "已复制" : "一键复制"}
              </button>
              <button 
                onClick={() => generate("zh")} 
                disabled={loadingZh}
                className="text-[10px] text-primary hover:underline flex items-center gap-1"
              >
                {loadingZh ? <LoadingSpinner size="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                AI 单独生成
              </button>
            </div>
          </div>
          <RichEditor 
            content={product.descriptionZh} 
            onChange={(h) => onUpdate({ descriptionZh: h })} 
            placeholder="输入产品详情介绍（中文）..."
          />
        </div>

        {/* 英文编辑器 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-[10px]">EN</span>
              英文详情文案 (Etsy/Global)
            </h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => copyToClipboard(product.descriptionEn, 'en')}
                className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${copiedEn ? 'text-green-400 bg-green-400/10' : 'text-text-muted hover:text-blue-400 hover:bg-blue-400/10'}`}
              >
                {copiedEn ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedEn ? "已复制" : "一键复制"}
              </button>
              <button 
                onClick={() => generate("en")} 
                disabled={loadingEn}
                className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
              >
                {loadingEn ? <LoadingSpinner size="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                AI 单独生成
              </button>
            </div>
          </div>
          <RichEditor 
            content={product.descriptionEn} 
            onChange={(h) => onUpdate({ descriptionEn: h })} 
            placeholder="Generate professional English description..."
          />
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner({ size = "w-4 h-4" }: { size?: string }) {
  return <div className={`${size} border-2 border-current border-t-transparent rounded-full animate-spin`} />;
}
