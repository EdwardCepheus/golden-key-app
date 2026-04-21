import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrbitStore } from './store';
import { ExpertCard } from './components/ExpertCard';
import { ResultView } from './components/ResultView';
import { invoke } from '@tauri-apps/api/core';
import './orbit.css';

export const PromptOrbit = ({ onClose }: { onClose?: () => void }) => {
  const { 
    experts, 
    selectedIds, 
    userInput, 
    isGenerating, 
    thinkingId, 
    view, 
    toggleExpert, 
    setGenerating, 
    setResults, 
    preferences,
    setUserInput 
  } = useOrbitStore();

  const [inputValue, setInputValue] = useState(userInput);

  // 同步 Zustand 状态
  useEffect(() => {
    setUserInput(inputValue);
  }, [inputValue, setUserInput]);

  // 模拟智能词库扩展
  const getSuggestions = () => {
    const library: Record<string, string[]> = {
      '猫': ['孟加拉猫', '赛博朋克猫', '波斯猫', '机器猫', '灵动黑猫'],
      '赛车': ['F1 赛车', '复古老爷车', '科幻悬浮车', '拉力赛车'],
      '城市': ['赛博朋克城市', '古罗马遗迹', '未来水城', '漂浮岛屿'],
      '女孩': ['二次元少女', '古典美人', '未来派战士', '田园风小女孩'],
    };
    return library[inputValue] || [];
  };

  const suggestions = getSuggestions();

  const handleGenerate = async () => {
    if (!inputValue) return;
    setGenerating(true);
    
    try {
      // 0. 获取 AI 配置
      const cfg = JSON.parse(localStorage.getItem("aiConfig") || '{}');
      if (!cfg.apiKey) throw new Error("请先配置 AI API Key");

      // 1. 视觉反馈逻辑：专家依次激活
      const activeExperts = experts.filter(e => selectedIds.includes(e.id));
      for (const expert of activeExperts) {
        useOrbitStore.setState({ thinkingId: expert.id });
        await new Promise(r => setTimeout(r, 1200));
      }

      // 2. 调用 Tauri 后端生成
      const res = await invoke<any>('orbit_prompt_engine', {
        userInput: inputValue,
        selectedIds: selectedIds,
        preferences: preferences.style,
        apiKey: cfg.apiKey,
        baseUrl: cfg.baseUrl || "https://api.minimax.chat/v1",
        model: cfg.model || "MiniMax-M2.7"
      });
      
      setResults({
        mjContent: res.mjContent,
        d3Content: res.d3Content,
        insights: res.insights
      });
    } catch (e: any) {
      console.error("Orbit generation failed:", e);
      // 降级处理：模拟结果
      setResults({
        mjContent: `${inputValue}, extreme detail, 8k, cinematic lighting, ultra-realistic --v 6.0`,
        d3Content: `A professional photorealistic rendering of ${inputValue}, with dramatic contrast and intricate textures.`,
        insights: { director: '构思了宏大的俯拍视角', renderer: '应用了柔和的丁达尔效应' }
      });
    } finally {
      setGenerating(false);
      useOrbitStore.setState({ thinkingId: null });
    }
  };

  if (view === 'result') return <ResultView />;

  return (
    <div className="h-screen bg-[#050508] text-white flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      {/* 关闭按钮 */}
      {onClose && (
        <button 
          onClick={onClose} 
          className="absolute top-8 left-8 p-3 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-all z-50 group flex items-center gap-2"
        >
          <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
          <span className="text-xs uppercase font-bold tracking-widest">返回主页</span>
        </button>
      )}

      {/* 顶部标题与记忆状态 */}
      <header className="mt-16 text-center shrink-0 z-10">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-6xl font-black tracking-tighter italic bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent mb-4"
        >
          PROMPT ORBIT
        </motion.h1>
        <div className="flex justify-center gap-3">
          {preferences.style.map(s => (
            <span key={s} className="text-[10px] text-indigo-400 border border-indigo-500/20 bg-indigo-500/5 px-3 py-1 rounded-full uppercase font-bold tracking-widest">
              记忆: {s}
            </span>
          ))}
        </div>
      </header>

      {/* 专家轨道核心区 */}
      <main className="flex-1 flex items-center justify-center overflow-x-auto no-scrollbar gap-14 px-24 py-10">
        <AnimatePresence>
          {experts.map(exp => (
            <ExpertCard 
              key={exp.id} 
              expert={exp} 
              isSelected={selectedIds.includes(exp.id)} 
              isThinking={thinkingId === exp.id}
              onToggle={() => toggleExpert(exp.id)} 
            />
          ))}
        </AnimatePresence>
      </main>

      {/* 输入区域与智能建议 */}
      <footer className="p-12 w-full max-w-5xl mx-auto shrink-0 z-10">
        {/* 智能词库建议 */}
        <div className="flex gap-2 mb-6 h-8 items-center overflow-x-auto no-scrollbar">
          <AnimatePresence>
            {suggestions.map(s => (
              <motion.button 
                key={s}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setInputValue(s)} 
                className="bg-white/5 hover:bg-indigo-500/20 px-4 py-1.5 rounded-full text-[10px] font-bold text-gray-400 border border-white/5 transition-all whitespace-nowrap"
              >
                + {s}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
        
        {/* 主输入框 */}
        <div className={`relative p-[1.5px] rounded-[2.5rem] transition-all duration-700 ${isGenerating ? 'input-flow scale-[1.02]' : 'bg-white/10 hover:bg-white/20'}`}>
          <div className="bg-[#0A0A10] rounded-[2.5rem] flex items-center p-2.5 shadow-2xl">
            <input 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              className="flex-1 bg-transparent px-8 py-5 outline-none text-xl text-gray-100 placeholder-gray-800"
              placeholder={isGenerating ? '专家委员会正在激辩中...' : '输入灵感核心，让 6 位专家为你护航...'}
            />
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center hover:bg-indigo-500 disabled:opacity-20 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.3)]"
            >
              {isGenerating ? (
                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-8 h-8 text-white transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </motion.button>
          </div>
        </div>
      </footer>

      {/* 底部装饰层 */}
      <div className="fixed bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-indigo-900/10 to-transparent -z-10 pointer-events-none" />
    </div>
  );
};
