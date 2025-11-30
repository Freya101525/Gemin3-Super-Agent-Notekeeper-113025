import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Code, 
  Wand2, 
  List, 
  Highlighter, 
  BrainCircuit, 
  GraduationCap,
  Settings,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Copy,
  Check
} from 'lucide-react';
import { generateText, AIConfig } from '../services/geminiService';
import { AI_PROMPTS, AI_MODELS } from '../constants';
import { FlowerTheme } from '../types';

interface NoteKeeperProps {
  theme: FlowerTheme;
  apiKey: string;
  onLog: (msg: string, type: 'info' | 'success' | 'error') => void;
}

interface FeatureSettings {
  model: string;
  maxTokens: number;
  prompt: string;
}

const NoteKeeper: React.FC<NoteKeeperProps> = ({ theme, apiKey, onLog }) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [rawText, setRawText] = useState('');
  const [processedText, setProcessedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [entities, setEntities] = useState<{name: string, context: string}[]>([]);
  const [summary, setSummary] = useState('');
  const [magicOutput, setMagicOutput] = useState<{type: string, content: string} | null>(null);

  // Custom Keyword Highlight State
  const [customKeywords, setCustomKeywords] = useState('');
  const [highlightColor, setHighlightColor] = useState('#FF7F50'); // Default Coral

  // Settings State for each feature
  const [settingsOpen, setSettingsOpen] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, FeatureSettings>>({
    'transform': { model: 'gemini-2.5-flash', maxTokens: 4096, prompt: AI_PROMPTS.TRANSFORM_MD },
    'entity': { model: 'gemini-2.5-flash', maxTokens: 4096, prompt: AI_PROMPTS.ENTITY_EXTRACTION },
    'format': { model: 'gemini-2.5-flash', maxTokens: 4096, prompt: AI_PROMPTS.AI_FORMATTING },
    'mindmap': { model: 'gemini-2.5-flash', maxTokens: 2048, prompt: AI_PROMPTS.MAGIC_MINDMAP },
    'quiz': { model: 'gemini-2.5-flash', maxTokens: 2048, prompt: AI_PROMPTS.MAGIC_QUIZ },
  });

  // --- Handlers ---

  const updateConfig = (feature: string, field: keyof FeatureSettings, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [feature]: { ...prev[feature], [field]: value }
    }));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onLog('Copied to clipboard', 'success');
  };

  const runAI = async (feature: string, outputHandler: (text: string) => void, isJson = false) => {
    if (!rawText.trim()) {
      onLog('Please enter some text first', 'error');
      return;
    }
    if (!apiKey) {
      onLog('API Key missing', 'error');
      return;
    }

    setIsProcessing(true);
    const config = configs[feature];
    const fullPrompt = `${config.prompt}\n\n[INPUT TEXT]:\n${rawText}`;

    try {
      const result = await generateText(fullPrompt, apiKey, {
        model: config.model,
        maxTokens: config.maxTokens,
        responseMimeType: isJson ? 'application/json' : 'text/plain'
      });
      outputHandler(result);
      onLog(`${feature.toUpperCase()} completed successfully`, 'success');
    } catch (err) {
      onLog(`Failed to run ${feature}: ${err}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 1. Transform to MD
  const handleTransform = () => {
    runAI('transform', (text) => {
      setProcessedText(text);
      setActiveTab('preview');
    });
  };

  // 2. Entity Extraction
  const handleEntityAnalysis = () => {
    runAI('entity', (text) => {
      try {
        // Handle potential markdown code block wrapping
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);
        setSummary(data.summary || 'No summary generated');
        setEntities(data.entities || []);
      } catch (e) {
        onLog('Failed to parse entity JSON', 'error');
      }
    }, true); // Request JSON mode
  };

  // 3. AI Formatting
  const handleAIFormat = () => {
    runAI('format', (text) => {
      setProcessedText(text);
      setActiveTab('preview');
    });
  };

  // 4. Custom Keywords (Client-side)
  const handleCustomHighlight = () => {
    if (!processedText && !rawText) return;
    const keywords = customKeywords.split(',').map(k => k.trim()).filter(k => k);
    
    if (keywords.length === 0) {
      onLog('No keywords provided', 'error');
      return;
    }

    let textToProcess = processedText || rawText;
    
    // Simple regex replacement (case insensitive)
    keywords.forEach(kw => {
        const regex = new RegExp(`(${kw})`, 'gi');
        textToProcess = textToProcess.replace(regex, `<span style="background-color: ${highlightColor}; color: white; padding: 0 4px; border-radius: 4px;">$1</span>`);
    });

    setProcessedText(textToProcess);
    setActiveTab('preview');
    onLog('Custom keywords highlighted', 'success');
  };

  // 5. Magic: Mindmap
  const handleMagicMindmap = () => {
    runAI('mindmap', (text) => {
      const code = text.replace(/```mermaid/g, '').replace(/```/g, '').trim();
      setMagicOutput({ type: 'Mindmap (Mermaid)', content: code });
    });
  };

  // 6. Magic: Quiz
  const handleMagicQuiz = () => {
    runAI('quiz', (text) => {
      setMagicOutput({ type: 'Quiz Generator', content: text });
    });
  };

  // --- Components ---
  
  const SettingsPanel = ({ feature, title }: { feature: string, title: string }) => {
    const config = configs[feature];
    const isOpen = settingsOpen === feature;

    return (
      <div className="border-b border-gray-100 dark:border-gray-700 last:border-0">
        <button 
          onClick={() => setSettingsOpen(isOpen ? null : feature)}
          className="w-full flex justify-between items-center p-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="font-semibold text-gray-700 dark:text-gray-300">{title} Settings</span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        
        {isOpen && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 space-y-3 text-xs">
            <div>
              <label className="block mb-1 font-medium">Model</label>
              <select 
                value={config.model}
                onChange={(e) => updateConfig(feature, 'model', e.target.value)}
                className="w-full p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                {AI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Max Tokens</label>
              <input 
                type="number" 
                value={config.maxTokens}
                onChange={(e) => updateConfig(feature, 'maxTokens', parseInt(e.target.value))}
                className="w-full p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Prompt Template</label>
              <textarea 
                value={config.prompt}
                onChange={(e) => updateConfig(feature, 'prompt', e.target.value)}
                className="w-full p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-20"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mr-4">
          <FileText className="text-gray-400" size={20} />
          <h2 className="font-bold">AI Note Keeper</h2>
        </div>
        
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2 hidden md:block"></div>

        <button onClick={handleTransform} disabled={isProcessing} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-100 transition-colors text-sm font-medium">
          <Code size={16} /> Transform to MD
        </button>

        <button onClick={handleEntityAnalysis} disabled={isProcessing} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100 transition-colors text-sm font-medium">
          <List size={16} /> Analyze Entities
        </button>

        <button onClick={handleAIFormat} disabled={isProcessing} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-100 transition-colors text-sm font-medium">
          <Wand2 size={16} /> AI Format
        </button>
        
        <div className="relative group">
           <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 hover:bg-pink-100 transition-colors text-sm font-medium">
             <BrainCircuit size={16} /> Magic Tools
           </button>
           <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 hidden group-hover:block z-20 overflow-hidden">
              <button onClick={handleMagicMindmap} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm flex items-center gap-2">
                 <BrainCircuit size={14} /> Mind Map Generator
              </button>
              <button onClick={handleMagicQuiz} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm flex items-center gap-2">
                 <GraduationCap size={14} /> Quiz Generator
              </button>
           </div>
        </div>

        <div className="ml-auto relative group">
           <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
             <Settings size={20} />
           </button>
           <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 hidden group-hover:block z-30 max-h-[80vh] overflow-y-auto">
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700 font-bold text-xs text-gray-500 uppercase tracking-wider">Configuration</div>
              <SettingsPanel feature="transform" title="Transform MD" />
              <SettingsPanel feature="entity" title="Entity Analysis" />
              <SettingsPanel feature="format" title="AI Format" />
              <SettingsPanel feature="mindmap" title="Mind Map" />
              <SettingsPanel feature="quiz" title="Quiz Generator" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        
        {/* Left: Input */}
        <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
             <span className="text-xs font-bold text-gray-500 uppercase">Input Text (Raw)</span>
             <button onClick={() => setRawText('')} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
               <RotateCcw size={12} /> Clear
             </button>
          </div>
          <textarea 
            className="flex-1 w-full p-4 bg-transparent outline-none resize-none font-mono text-sm leading-relaxed"
            placeholder="Paste your 510(k) notes or regulatory text here..."
            value={rawText}
            onChange={e => setRawText(e.target.value)}
          />
        </div>

        {/* Right: Output */}
        <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
           <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
              <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab('edit')} 
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'edit' ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Source
                </button>
                <button 
                  onClick={() => setActiveTab('preview')} 
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Preview
                </button>
              </div>
              <div className="flex items-center gap-2">
                 {/* Keyword Highlighter Controls */}
                 <div className="flex items-center bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg px-2 py-0.5">
                    <input 
                      type="text" 
                      placeholder="Keywords..." 
                      className="w-24 text-xs bg-transparent outline-none"
                      value={customKeywords}
                      onChange={e => setCustomKeywords(e.target.value)}
                    />
                    <input 
                      type="color" 
                      value={highlightColor}
                      onChange={e => setHighlightColor(e.target.value)}
                      className="w-4 h-4 rounded border-none cursor-pointer"
                      title="Highlight Color"
                    />
                    <button onClick={handleCustomHighlight} className="ml-2 text-gray-500 hover:text-primary">
                       <Highlighter size={14} />
                    </button>
                 </div>
                 <button onClick={() => handleCopy(processedText)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <Copy size={16} />
                 </button>
              </div>
           </div>

           <div className="flex-1 relative overflow-hidden">
              {isProcessing && (
                <div className="absolute inset-0 z-10 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center flex-col gap-3">
                   <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-sm font-semibold text-indigo-600 animate-pulse">AI is thinking...</span>
                </div>
              )}
              
              {activeTab === 'edit' ? (
                <textarea 
                  className="w-full h-full p-4 bg-transparent outline-none resize-none font-mono text-sm leading-relaxed"
                  value={processedText}
                  onChange={e => setProcessedText(e.target.value)}
                  placeholder="Processed markdown will appear here..."
                />
              ) : (
                 <div 
                   className="w-full h-full p-6 overflow-y-auto prose dark:prose-invert prose-sm max-w-none"
                   dangerouslySetInnerHTML={{ 
                     // Simple Markdown parser for preview (Normally would use a library like react-markdown)
                     // For this demo, we handle simple bolding/headers/lists and preserve HTML tags for highlighting
                     __html: processedText
                        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-primary">$1</h3>')
                        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 border-b pb-1">$1</h2>')
                        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-2 mb-4">$1</h1>')
                        .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
                        .replace(/\n/gim, '<br />') 
                   }}
                 />
              )}
           </div>
        </div>
      </div>

      {/* Bottom Section: Analysis Results */}
      {(entities.length > 0 || magicOutput) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
           
           {/* Entities Table */}
           {entities.length > 0 && (
             <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-emerald-600">
                  <List size={20} /> AI Summary & Entities
                </h3>
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border-l-4 border-emerald-500">
                  "{summary}"
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-semibold">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Entity Name</th>
                        <th className="px-4 py-3 rounded-tr-lg">Context</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {entities.map((ent, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{ent.name}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{ent.context}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
           )}

           {/* Magic Output */}
           {magicOutput && (
             <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-pink-600">
                  <Wand2 size={20} /> {magicOutput.type} Output
                </h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto relative group">
                   <button 
                     onClick={() => handleCopy(magicOutput.content)}
                     className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Copy size={14} />
                   </button>
                   <pre>{magicOutput.content}</pre>
                </div>
                {magicOutput.type === 'Quiz Generator' && (
                   <p className="mt-4 text-sm text-gray-500">You can copy the above Markdown and paste it into the editor to view formatted questions.</p>
                )}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default NoteKeeper;
