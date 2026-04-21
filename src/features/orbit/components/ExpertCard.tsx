import { motion, AnimatePresence } from 'framer-motion';
import { Expert } from '../store';

export const ExpertCard = ({ expert, isSelected, isThinking, onToggle }: { expert: Expert, isSelected: boolean, isThinking: boolean, onToggle: () => void }) => {
  return (
    <div className="relative group">
      {/* 动态对话气泡 */}
      <AnimatePresence>
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: -20 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="expert-bubble absolute -top-24 left-1/2 -translate-x-1/2 w-48 bg-white text-black p-4 rounded-3xl text-xs font-bold shadow-2xl z-50"
          >
            <p className="flex items-center gap-2"><span className="animate-spin text-indigo-500">🌀</span> {expert.status}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.1, y: -10 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className={`relative z-10 p-8 rounded-[2.5rem] cursor-pointer transition-all duration-500 border flex flex-col items-center justify-center min-w-[180px] ${
          isSelected ? 'bg-white/5 border-white/20 shadow-2xl' : 'grayscale opacity-30 border-transparent'
        }`}
      >
        <div className="text-6xl mb-6 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">{expert.icon}</div>
        
        <div 
          className="px-6 py-1.5 rounded-xl text-white font-black text-[10px] tracking-widest uppercase mb-2 shadow-lg"
          style={{ backgroundColor: expert.color }}
        >
          {expert.name}
        </div>
        <p className="text-[10px] text-gray-500 uppercase tracking-tighter font-bold">{expert.role}</p>

        {/* 背景呼吸光晕 */}
        {isSelected && (
          <div 
            className="expert-glow absolute inset-0 rounded-[2.5rem] -z-10 blur-3xl opacity-30" 
            style={{ backgroundColor: expert.color }} 
          />
        )}
      </motion.div>
    </div>
  );
};
