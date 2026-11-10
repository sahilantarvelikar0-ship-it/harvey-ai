import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallBanner: React.FC = () => {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed or dismissed, do not render
  if (isInstalled || dismissed) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <>
      <div className="relative mx-auto max-w-2xl px-4 pt-2">
        <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-blue-950/80 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] text-xs backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-cyan-200 tracking-wide truncate">
                Install HARVEY Mobile App
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                Instant access from home screen · Offline capable · Fullscreen HUD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canInstall && (
              <button
                onClick={install}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wider shadow-[0_0_12px_rgba(6,182,212,0.4)] active:scale-95 transition-all"
              >
                Install
              </button>
            )}

            {isIOS && !canInstall && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 hover:bg-cyan-500/30 text-cyan-200 font-semibold text-xs tracking-wide active:scale-95 transition-all"
              >
                How to Install
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              aria-label="Dismiss install banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(6,182,212,0.25)] text-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <h3 className="font-mono font-bold text-cyan-300 text-sm tracking-wide flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" />
                Install on iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono flex items-center justify-center shrink-0 text-xs font-bold">
                  1
                </span>
                <p>
                  In Safari, tap the <strong className="text-cyan-300 inline-flex items-center gap-1">Share <Share className="w-3.5 h-3.5" /></strong> button in the browser toolbar.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono flex items-center justify-center shrink-0 text-xs font-bold">
                  2
                </span>
                <p>
                  Scroll down the share options and tap <strong className="text-cyan-300 inline-flex items-center gap-1">Add to Home Screen <PlusSquare className="w-3.5 h-3.5" /></strong>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono flex items-center justify-center shrink-0 text-xs font-bold">
                  3
                </span>
                <p>
                  Tap <strong className="text-cyan-300">Add</strong> in the top-right corner. HARVEY will now appear as an app icon on your iPhone home screen.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs tracking-wider uppercase hover:bg-cyan-400 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
