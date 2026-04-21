import { motion } from 'framer-motion';
import { useOrbitStore } from '../store';

export const ResultView = () => {
  const { results, setView } = useOrbitStore();

  return (
    <div className="min-h-screen bg-[#050508] text-white p-12">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <button onClick={() => setView('orbit')} className="mb-12 text-gray-500 hover:text-white transition group flex items-center gap-2">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> 返回轨道重新设计
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1">
          {/* Midjourney 赛道 */}
          <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0D0D14] rounded-[3rem] p-10 border border-white/5 relative group overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-8 text-indigo-500 font-black text-6xl opacity-5">MJ</div>
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-8">Midjourney Optimized</h3>
            <p className="text-2xl leading-relaxed text-gray-200 flex-1 selection:bg-indigo-500/30">{results?.mjContent}</p>
            <button className="mt-12 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white w-full py-5 rounded-2xl border border-indigo-500/20 transition-all font-bold text-sm tracking-widest uppercase">复制 MJ 提示词</button>
          </motion.div>

          {/* DALL-E 3 赛道 */}
          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0D0D14] rounded-[3rem] p-10 border border-white/5 relative group overflow-hidden flex flex-col">
             <div className="absolute top-0 right-0 p-8 text-orange-500 font-black text-6xl opacity-5">D3</div>
             <h3 className="text-xs font-black text-orange-400 uppercase tracking-[0.3em] mb-8">DALL-E 3 Semantic</h3>
             <p className="text-2xl leading-relaxed text-gray-200 flex-1 selection:bg-orange-500/30">{results?.d3Content}</p>
             <button className="mt-12 bg-orange-600/10 hover:bg-orange-600 text-orange-400 hover:text-white w-full py-5 rounded-2xl border border-orange-500/20 transition-all font-bold text-sm tracking-widest uppercase">复制 DALL-E 3 提示词</button>
          </motion.div>
        </div>

        {/* 专家共创报告 */}
        <div className="mt-10 bg-[#0D0D14] rounded-[2.5rem] p-10 border border-white/5 backdrop-blur-xl">
          <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-10 text-center">专家委员会 · 决策共创分析报告</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 px-10">
            {Object.entries(results?.insights || {}).map(([id, text]) => (
              <div key={id} className="flex flex-col items-center text-center">
                <p className="text-indigo-400 text-[10px] font-black mb-4 uppercase tracking-[0.2em]">{id}</p>
                <div className="w-1 h-8 bg-indigo-500/20 mb-4" />
                <p className="text-gray-400 text-sm leading-relaxed italic font-medium">"{text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
