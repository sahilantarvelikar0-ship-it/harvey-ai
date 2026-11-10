import React from 'react';
import { HarveyLogo } from './HarveyLogo.tsx';
import { SystemStatus } from '../types.ts';
import { RefreshCw, Volume2, VolumeX, MoreVertical } from 'lucide-react';

interface HeaderProps {
  status: SystemStatus;
  onNewSession: () => void;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  isStreaming: boolean;
  onOpenDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onNewSession,
  autoSpeak,
  onToggleAutoSpeak,
  isStreaming,
  onOpenDrawer,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#050914]/95 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Prominent Brand & Status Beacon */}
        <div className="flex items-center gap-3 sm:gap-3.5 shrink-0">
          <HarveyLogo size="md" isThinking={isStreaming} />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {/* Prominent HARVEY wordmark */}
              <h1 className="text-xl sm:text-2xl font-black tracking-[0.2em] font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 via-white to-cyan-400 drop-shadow-[0_0_16px_rgba(34,211,238,0.4)]">
                HARVEY
              </h1>
              <span className="hidden xs:inline-block text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 uppercase">
                AI Companion
              </span>
              <span className="text-[10px] tracking-wide font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                <span>⚡</span>
                <span className="hidden sm:inline">Turbo</span>
              </span>
            </div>

            {/* Live status line */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  status.status === 'online'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                    : status.status === 'checking'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="font-mono text-[10px] tracking-wider text-cyan-400/90 uppercase">
                {status.status === 'online' ? 'System Online' : status.status}
              </span>
              {status.latency !== undefined && (
                <>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {status.latency}ms
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions and Top-Right 3-Dots Menu Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Voice Auto-narrate button */}
          <button
            onClick={onToggleAutoSpeak}
            className={`min-h-[42px] min-w-[42px] sm:min-w-0 px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              autoSpeak
                ? 'bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                : 'bg-slate-900/70 border border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title={autoSpeak ? 'Voice response enabled' : 'Voice response muted'}
            aria-label="Toggle voice response"
          >
            {autoSpeak ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{autoSpeak ? 'Voice On' : 'Voice Off'}</span>
          </button>

          {/* New Chat Action */}
          <button
            onClick={onNewSession}
            className="min-h-[42px] px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center gap-1.5 shadow-[0_0_16px_rgba(6,182,212,0.35)] active:scale-[0.98] transition-all whitespace-nowrap"
            title="Start fresh conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>

          {/* 3-Dots / Menu Settings Icon on the top-right corner */}
          <button
            onClick={onOpenDrawer}
            className="min-h-[42px] min-w-[42px] p-2 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-700/60 hover:border-cyan-400/50 text-cyan-300 hover:text-cyan-200 flex items-center justify-center shadow-sm active:scale-95 transition-all group"
            title="Open HARVEY Navigation Menu"
            aria-label="Open Navigation Drawer"
          >
            <MoreVertical className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
};
