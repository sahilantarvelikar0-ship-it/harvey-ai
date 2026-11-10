import React from 'react';
import { Sparkles, Terminal, Compass, Globe, ShieldCheck } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt }) => {
  const prompts = [
    {
      icon: Terminal,
      title: 'English · Status Brief',
      text: 'Good day Harvey. Run a complete status diagnostic and outline our top strategic focus for today.',
      langBadge: 'English',
    },
    {
      icon: Globe,
      title: 'मराठी · कार्य नियोजन (Marathi)',
      text: 'हार्वे, आजच्या दिवसासाठी एकाग्रतेने काम करण्याचे 3 महत्त्वाचे नियम मराठीत सांगा.',
      langBadge: 'मराठी',
    },
    {
      icon: Sparkles,
      title: 'Español · Estrategia (Spanish)',
      text: 'Hola Harvey, ¿puedes sugerir tres hábitos clave para maximizar mi productividad diaria?',
      langBadge: 'Español',
    },
    {
      icon: Globe,
      title: '日本語 · 作業計画 (Japanese)',
      text: 'ハーヴェイ、今日の効率的な作業計画を3つのポイントで簡潔に教えてください。',
      langBadge: '日本語',
    },
    {
      icon: Sparkles,
      title: 'हिंदी · दैनिक प्राथमिकताएं',
      text: 'हार्वे, आज के दिन को अधिकतम उत्पादक बनाने के लिए व्यवस्थित प्राथमिकताओं की सूची तैयार करें।',
      langBadge: 'हिन्दी',
    },
    {
      icon: Compass,
      title: 'Hinglish · Quick Sync',
      text: 'Harvey bhai, kya haal chaal? Ek smart weekly project schedule organize karne mein help karo na.',
      langBadge: 'Hinglish',
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4 animate-message-in">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-[10px] font-mono uppercase tracking-widest text-cyan-300 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Universal Dynamic Multilingual · End-to-End Encrypted</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-200">
          How may I assist you today, Sir?
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Dynamically recognizes and speaks any global language: Marathi, Spanish, French, German, Japanese, Hindi, Hinglish, English, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {prompts.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => onSelectPrompt(item.text)}
              className="flex items-start gap-3 p-3 text-left rounded-xl bg-[#091226]/80 hover:bg-[#0e1d3e] border border-cyan-500/15 hover:border-cyan-400/40 transition-all duration-200 group active:scale-[0.99] focus:outline-none focus:ring-1 focus:ring-cyan-400/40 shadow-sm"
            >
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 group-hover:text-cyan-300 shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-slate-200 group-hover:text-cyan-200 transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/20 text-cyan-300">
                    {item.langBadge}
                  </span>
                </div>
                <div className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {item.text}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
