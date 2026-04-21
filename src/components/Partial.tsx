import { useState } from "react";

// This file contains the remaining components that were cut off from App.tsx

// Tags Tab
export function TagsTab({ product, onUpdate, allTags }: { product: any; onUpdate: (p: any) => void; allTags: string[] }) {
  const [newTag, setNewTag] = useState("");

  function addTag() {
    const tag = newTag.trim();
    if (!tag || product.tags.includes(tag)) return;
    onUpdate({ tags: [...product.tags, tag] });
    setNewTag("");
  }

  function removeTag(tag: string) {
    onUpdate({ tags: product.tags.filter((t: string) => t !== tag) });
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1.5">添加标签</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTag(); }}
            placeholder="输入标签名称后回车"
            className="input flex-1"
          />
          <button onClick={addTag} className="btn-primary text-sm">添加</button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div>
          <p className="text-xs text-text-muted mb-2">推荐标签（从所有产品中）</p>
          <div className="flex flex-wrap gap-1">
            {allTags.filter((t) => !product.tags.includes(t)).map((tag) => (
              <button
                key={tag}
                onClick={() => onUpdate({ tags: [...product.tags, tag] })}
                className="text-xs px-2 py-0.5 rounded bg-dark-border text-text-muted hover:text-text-primary transition-colors"
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
            {product.tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Settings Modal
export function SettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">设置</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">×</button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-dark-border">
            <div>
              <p className="text-sm font-medium">主题模式</p>
              <p className="text-xs text-text-muted">选择界面明暗主题</p>
            </div>
            <span className="text-sm text-text-muted">跟随系统</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-dark-border">
            <div>
              <p className="text-sm font-medium">数据存储</p>
              <p className="text-xs text-text-muted">本地 SQLite 数据库</p>
            </div>
            <span className="text-xs bg-green-400/20 text-green-400 px-2 py-0.5 rounded">已启用</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-dark-border">
            <div>
              <p className="text-sm font-medium">AI 集成</p>
              <p className="text-xs text-text-muted">当前为 Stub 模式</p>
            </div>
            <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded">待配置</span>
          </div>
          <div className="pt-2">
            <p className="text-xs text-text-muted mb-2">版本信息</p>
            <p className="text-sm font-mono">金钥匙 v0.1.0</p>
            <p className="text-xs text-text-muted mt-1">Tauri v2 + React + TypeScript</p>
          </div>
        </div>
      </div>
    </div>
  );
}
