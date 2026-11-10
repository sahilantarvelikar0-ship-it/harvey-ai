import React from 'react';
import { Puzzle, X, Globe, Code2, FileSpreadsheet, Calculator, Check } from 'lucide-react';

export interface PluginItem {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  category: string;
}

interface PluginsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plugins: PluginItem[];
  onTogglePlugin: (id: string) => void;
}

export const PluginsModal: React.FC<PluginsModalProps> = ({
  isOpen,
  onClose,
  plugins,
  onTogglePlugin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in text-slate-100 font-sans">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#070e1e] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-[#081328]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-slate-100 font-mono">
                HARVEY NEURAL PLUGINS
              </h3>
              <p className="text-[11px] text-slate-400">Grounding, analysis sandboxes and computational modules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close plugins"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plugin Cards List */}
        <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {plugins.map(plugin => {
            const Icon = plugin.icon;
            return (
              <div
                key={plugin.id}
                onClick={() => onTogglePlugin(plugin.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  plugin.enabled
                    ? 'bg-[#091734] border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-[#081226]/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg border shrink-0 transition-colors ${
                      plugin.enabled
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-200">{plugin.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/20 text-cyan-400 uppercase">
                        {plugin.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {plugin.description}
                    </p>
                  </div>
                </div>

                {/* Toggle switch visual */}
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                    plugin.enabled ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                      plugin.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyan-500/20 bg-[#081328] flex items-center justify-between text-xs text-slate-400">
          <span>Active Plugins: {plugins.filter(p => p.enabled).length}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors min-h-[44px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
