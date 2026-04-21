import { create } from 'zustand';

export interface Expert {
  id: string;
  name: string;
  icon: string;
  color: string;
  role: string;
  status: string;
}

export interface OrbitResult {
  mjContent: string;
  d3Content: string;
  insights: Record<string, string>;
}

interface OrbitState {
  experts: Expert[];
  selectedIds: string[];
  userInput: string;
  isGenerating: boolean;
  thinkingId: string | null;
  results: OrbitResult | null;
  view: 'orbit' | 'result';
  preferences: { style: string[] };
  
  toggleExpert: (id: string) => void;
  setGenerating: (status: boolean, id?: string | null) => void;
  setResults: (res: OrbitResult) => void;
  addPreference: (style: string) => void;
  setView: (v: 'orbit' | 'result') => void;
  setUserInput: (v: string) => void;
}

export const useOrbitStore = create<OrbitState>((set) => ({
  experts: [
    { id: 'director', name: '艺术总监', icon: '🎨', color: '#EF4444', role: '构图视角', status: '正在构思布局...' },
    { id: 'sketcher', name: '草稿师', icon: '✏️', color: '#3B82F6', role: '主体细节', status: '正在描绘轮廓...' },
    { id: 'renderer', name: '渲染师', icon: '🪄', color: '#10B981', role: '光影材质', status: '正在计算折射...' },
    { id: 'illustrator', name: '插画师', icon: '🖌️', color: '#F59E0B', role: '艺术风格', status: '正在调配色板...' },
    { id: 'copywriter', name: '文案专家', icon: '✍️', color: '#8B5CF6', role: '词汇优化', status: '正在提炼关键词...' },
    { id: 'optimizer', name: '优化专家', icon: '🔬', color: '#EC4899', role: '模型适配', status: '正在校准参数...' },
  ],
  selectedIds: ['director', 'sketcher', 'renderer'],
  userInput: '',
  isGenerating: false,
  thinkingId: null,
  results: null,
  view: 'orbit',
  preferences: { style: ['电影感', '深蓝色调'] },

  toggleExpert: (id) => set((s) => ({
    selectedIds: s.selectedIds.includes(id) ? s.selectedIds.filter(i => i !== id) : [...s.selectedIds, id]
  })),
  setGenerating: (isGenerating, thinkingId = null) => set({ isGenerating, thinkingId }),
  setResults: (results) => set({ results, view: 'result' }),
  addPreference: (style) => set((s) => ({ preferences: { style: [...new Set([...s.preferences.style, style])] } })),
  setView: (view) => set({ view }),
  setUserInput: (userInput) => set({ userInput }),
}));
