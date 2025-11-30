import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  GitBranch, 
  Bot, 
  Settings, 
  Sun, 
  Moon, 
  Globe, 
  Activity, 
  Zap, 
  Award,
  PenTool,
  Flower2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

import { FLOWER_THEMES, TRANSLATIONS } from './constants';
import { Language, ThemeMode, AppState, PipelineStep, LogEntry } from './types';
import FlowerWheel from './components/FlowerWheel';
import SettingsModal from './components/SettingsModal';
import NoteKeeper from './components/NoteKeeper';
import { generateText } from './services/geminiService';

const App: React.FC = () => {
  // --- State Management ---
  const [state, setState] = useState<AppState>({
    language: Language.ZH,
    themeMode: ThemeMode.DARK,
    currentFlowerId: 'rose',
    health: 85,
    mana: 60,
    experience: 1200,
    level: 3,
    apiKeys: { openai: '', gemini: '', anthropic: '', xai: '' }
  });

  const [activeTab, setActiveTab] = useState<'input' | 'pipeline' | 'notes' | 'dashboard'>('input');
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [observationText, setObservationText] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    { agentId: 'AG-01', name: 'Compliance Check', status: 'pending' },
    { agentId: 'AG-02', name: 'Risk Analysis', status: 'pending' },
    { agentId: 'AG-03', name: 'Clinical Review', status: 'pending' },
    { agentId: 'AG-04', name: 'Final Summary', status: 'pending' },
  ]);

  // --- Derived Data ---
  const currentTheme = FLOWER_THEMES.find(t => t.id === state.currentFlowerId) || FLOWER_THEMES[0];
  const t = TRANSLATIONS[state.language];

  // --- Effects ---
  useEffect(() => {
    // Apply theme variables to root
    const root = document.documentElement;
    root.style.setProperty('--primary', currentTheme.primaryColor);
    root.style.setProperty('--secondary', currentTheme.secondaryColor);
    root.style.setProperty('--accent', currentTheme.accentColor);
    
    if (state.themeMode === ThemeMode.DARK) {
      root.classList.add('dark');
      root.style.setProperty('--bg-color', currentTheme.darkBgColor);
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--bg-color', currentTheme.bgColor);
    }
  }, [state.currentFlowerId, state.themeMode, currentTheme]);

  // --- Handlers ---
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), message, type }, ...prev]);
  };

  const handleRunPipeline = async () => {
    if (state.mana < 20) {
      addLog("Not enough Mana (AI Resources)!", "error");
      return;
    }

    setState(prev => ({ ...prev, mana: prev.mana - 20 }));
    addLog("Starting 510(k) Review Pipeline...", "info");

    const newSteps = [...pipelineSteps];
    
    // Simulate pipeline execution
    for (let i = 0; i < newSteps.length; i++) {
        newSteps[i] = { ...newSteps[i], status: 'running' };
        setPipelineSteps([...newSteps]);
        
        // Simulate delay
        await new Promise(r => setTimeout(r, 1500));
        
        // Only actually call API for the first step as a demo if text exists
        let output = "Simulated pass.";
        if (i === 0 && inputText) {
            try {
                // Using Gemini Service
                output = await generateText(
                    `System: You are an FDA 510(k) reviewer. Briefly analyze: ${inputText}`,
                    state.apiKeys.gemini
                );
            } catch (e) {
                output = "API Call Failed. Using simulation.";
            }
        }

        newSteps[i] = { ...newSteps[i], status: 'completed', output };
        setPipelineSteps([...newSteps]);
        setState(prev => ({ ...prev, experience: prev.experience + 50 }));
    }
    
    addLog("Pipeline completed successfully!", "success");
  };

  // --- Component Parts ---

  const renderStatusCard = (title: string, value: number, max: number, color: string, icon: React.ReactNode) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
      <div className={`p-3 rounded-full text-white`} style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{value}/{max}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(value/max)*100}%`, backgroundColor: color }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen transition-colors duration-300 font-sans flex text-gray-800 dark:text-gray-100" style={{ backgroundColor: 'var(--bg-color)' }}>
      
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-r border-gray-200 dark:border-gray-800 flex flex-col fixed h-full z-10 transition-all">
         <div className="p-6 flex items-center justify-center lg:justify-start space-x-3 border-b border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: currentTheme.primaryColor }}>
               <Activity size={24} />
            </div>
            <span className="hidden lg:block font-bold text-lg tracking-tight">FDA Studio</span>
         </div>

         <nav className="flex-1 p-4 space-y-2">
            {[
                { id: 'input', label: t.input, icon: <FileText size={20} /> },
                { id: 'pipeline', label: t.pipeline, icon: <GitBranch size={20} /> },
                { id: 'notes', label: t.notes, icon: <Bot size={20} /> },
                { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard size={20} /> },
            ].map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                        activeTab === item.id 
                        ? 'text-white shadow-md' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    style={activeTab === item.id ? { backgroundColor: currentTheme.primaryColor } : {}}
                >
                    {item.icon}
                    <span className="hidden lg:block font-medium">{item.label}</span>
                </button>
            ))}
         </nav>

         <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
             <button onClick={() => setIsWheelOpen(true)} className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                <Flower2 size={20} style={{ color: currentTheme.primaryColor }} />
                <span className="hidden lg:block font-medium">{t.spinWheel}</span>
             </button>
             <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                <Settings size={20} />
                <span className="hidden lg:block font-medium">{t.settings}</span>
             </button>
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 overflow-y-auto">
        
        {/* Top Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold mb-1" style={{ color: currentTheme.primaryColor }}>
                    {state.language === Language.ZH ? currentTheme.nameZh : currentTheme.nameEn} Edition
                </h1>
                <p className="text-gray-500 dark:text-gray-400">{t.subtitle}</p>
            </div>

            <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setState(prev => ({ ...prev, language: prev.language === Language.EN ? Language.ZH : Language.EN }))}
                  className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform"
                >
                   <Globe size={20} />
                </button>
                <button 
                  onClick={() => setState(prev => ({ ...prev, themeMode: prev.themeMode === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT }))}
                  className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform"
                >
                   {state.themeMode === ThemeMode.LIGHT ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {renderStatusCard(t.level, state.level, 10, currentTheme.accentColor, <Award size={18} />)}
            {renderStatusCard(t.health, state.health, 100, '#10b981', <Activity size={18} />)}
            {renderStatusCard(t.mana, state.mana, 100, '#3b82f6', <Zap size={18} />)}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 rounded-xl shadow-lg flex flex-col justify-center">
                <span className="text-gray-400 text-sm mb-1">{t.theme}</span>
                <span className="font-bold text-lg flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: currentTheme.primaryColor }}></span>
                    {state.language === Language.ZH ? currentTheme.nameZh : currentTheme.nameEn}
                </span>
            </div>
        </div>

        {/* Content Area */}
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 min-h-[600px] shadow-xl border border-white/20">
            
            {activeTab === 'input' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="flex-1 flex flex-col">
                            <label className="mb-2 font-semibold text-gray-700 dark:text-gray-300">510(k) Template Content</label>
                            <textarea 
                                className="flex-1 w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 outline-none transition-all resize-none font-mono text-sm"
                                style={{ '--tw-ring-color': currentTheme.primaryColor } as React.CSSProperties}
                                placeholder="Paste your template here..."
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                            />
                        </div>
                        <div className="h-1/3 flex flex-col">
                            <label className="mb-2 font-semibold text-gray-700 dark:text-gray-300">Observations</label>
                            <textarea 
                                className="flex-1 w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 outline-none transition-all resize-none text-sm"
                                style={{ '--tw-ring-color': currentTheme.primaryColor } as React.CSSProperties}
                                placeholder="Notes and observations..."
                                value={observationText}
                                onChange={e => setObservationText(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 h-full overflow-hidden flex flex-col">
                             <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Activity size={16} /> Activity Log
                             </h3>
                             <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {logs.length === 0 && <p className="text-gray-400 text-sm text-center mt-10">No activity yet</p>}
                                {logs.map(log => (
                                    <div key={log.id} className="text-xs p-2 rounded bg-gray-50 dark:bg-gray-700/50 border-l-2" style={{ borderColor: log.type === 'error' ? 'red' : log.type === 'success' ? 'green' : currentTheme.secondaryColor }}>
                                        <span className="text-gray-400 mr-2">[{log.timestamp}]</span>
                                        {log.message}
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'pipeline' && (
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold">Standard Review Pipeline</h2>
                            <p className="text-gray-500">ID: PIPE-510K-STD</p>
                        </div>
                        <button 
                            onClick={handleRunPipeline}
                            className="px-6 py-3 rounded-xl text-white font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                            style={{ backgroundColor: currentTheme.primaryColor }}
                        >
                            <Zap size={20} /> {t.run}
                        </button>
                    </div>

                    <div className="space-y-6">
                        {pipelineSteps.map((step, idx) => (
                            <div key={idx} className="relative pl-8 pb-8 border-l-2 last:border-0 border-gray-200 dark:border-gray-700">
                                <div 
                                    className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-colors duration-500`}
                                    style={{ 
                                        backgroundColor: step.status === 'completed' ? currentTheme.primaryColor : step.status === 'running' ? '#fbbf24' : 'transparent',
                                        borderColor: currentTheme.primaryColor
                                    }}
                                ></div>
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg">{step.name}</h3>
                                        <span className={`text-xs px-2 py-1 rounded font-medium uppercase ${
                                            step.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            step.status === 'running' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                        }`}>
                                            {step.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mb-4">Agent: {step.agentId}</p>
                                    {step.output && (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm font-mono border border-gray-200 dark:border-gray-700">
                                            {step.output}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'notes' && (
               <NoteKeeper 
                 theme={currentTheme}
                 apiKey={state.apiKeys.gemini}
                 onLog={addLog}
               />
            )}

            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold mb-6">Review Progress</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Mon', tasks: 4 },
                                    { name: 'Tue', tasks: 3 },
                                    { name: 'Wed', tasks: 7 },
                                    { name: 'Thu', tasks: 5 },
                                    { name: 'Fri', tasks: 8 },
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip contentStyle={{ backgroundColor: state.themeMode === ThemeMode.DARK ? '#1f2937' : '#fff', borderRadius: '8px' }} />
                                    <Bar dataKey="tasks" fill={currentTheme.primaryColor} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold mb-6">Agent Performance</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={[
                                    { name: 'Step 1', accuracy: 85 },
                                    { name: 'Step 2', accuracy: 88 },
                                    { name: 'Step 3', accuracy: 92 },
                                    { name: 'Step 4', accuracy: 90 },
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip contentStyle={{ backgroundColor: state.themeMode === ThemeMode.DARK ? '#1f2937' : '#fff', borderRadius: '8px' }} />
                                    <Line type="monotone" dataKey="accuracy" stroke={currentTheme.secondaryColor} strokeWidth={3} dot={{ fill: currentTheme.primaryColor }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </main>

      {/* Modals */}
      <FlowerWheel 
        isOpen={isWheelOpen} 
        onClose={() => setIsWheelOpen(false)} 
        onSelectTheme={(theme) => {
            setState(prev => ({ ...prev, currentFlowerId: theme.id }));
            // Keep wheel open a moment to show result? Or close immediately. 
            // The component handles animation delay.
        }} 
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={state.language}
        apiKeys={state.apiKeys}
        onUpdateKey={(key, val) => setState(prev => ({ ...prev, apiKeys: { ...prev.apiKeys, [key]: val } }))}
      />

    </div>
  );
};

export default App;