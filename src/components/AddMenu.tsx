import React, { useRef, useEffect } from 'react';
import {
  Plus,
  Camera,
  Image as ImageIcon,
  Paperclip,
  Puzzle,
  BrainCircuit,
  Check,
} from 'lucide-react';

interface AddMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleOpen: () => void;
  onSelectCamera: () => void;
  onSelectPhotos: () => void;
  onSelectFiles: () => void;
  onOpenPlugins: () => void;
  thinkHarder: boolean;
  onToggleThinkHarder: () => void;
  activePluginCount: number;
}

export const AddMenu: React.FC<AddMenuProps> = ({
  isOpen,
  onClose,
  onToggleOpen,
  onSelectCamera,
  onSelectPhotos,
  onSelectFiles,
  onOpenPlugins,
  thinkHarder,
  onToggleThinkHarder,
  activePluginCount,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Plus '+' Button */}
      <button
        type="button"
        onClick={onToggleOpen}
        className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all ${
          isOpen
            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] rotate-45'
            : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/50'
        }`}
        title="Add attachments, capture photo, plugins & reasoning mode"
        aria-label="Add options"
      >
        <Plus className="w-5 h-5 transition-transform duration-200" />
      </button>

      {/* Futuristic Floating Popover Menu */}
      {isOpen && (
        <div className="absolute bottom-14 left-0 z-50 w-64 rounded-2xl bg-[#091124]/95 border border-cyan-500/30 p-2 shadow-[0_10px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl animate-fade-in text-slate-200 text-xs font-sans">
          {/* Header Tag */}
          <div className="px-2.5 py-1.5 border-b border-cyan-500/15 mb-1.5 flex items-center justify-between text-[10px] font-mono tracking-wider text-cyan-400 uppercase">
            <span>Multimodal Tools</span>
            <span className="text-slate-500">v3.8</span>
          </div>

          <div className="space-y-1">
            {/* Camera */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectCamera();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-cyan-950/60 hover:text-cyan-200 text-left transition-colors group"
            >
              <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/20 text-cyan-400 group-hover:border-cyan-400/50 shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-200 group-hover:text-cyan-200">Camera</div>
                <div className="text-[10px] text-slate-400 truncate">Webcam snapshot & vision feed</div>
              </div>
            </button>

            {/* Photos / Images */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectPhotos();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-cyan-950/60 hover:text-cyan-200 text-left transition-colors group"
            >
              <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/20 text-cyan-400 group-hover:border-cyan-400/50 shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-200 group-hover:text-cyan-200">Photos / Images</div>
                <div className="text-[10px] text-slate-400 truncate">PNG, JPG, WEBP visual analysis</div>
              </div>
            </button>

            {/* Files / Documents */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectFiles();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-cyan-950/60 hover:text-cyan-200 text-left transition-colors group"
            >
              <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/20 text-cyan-400 group-hover:border-cyan-400/50 shrink-0">
                <Paperclip className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-200 group-hover:text-cyan-200">Files</div>
                <div className="text-[10px] text-slate-400 truncate">PDF, TXT, CSV, Code, MD</div>
              </div>
            </button>

            {/* Plugins */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPlugins();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-cyan-950/60 hover:text-cyan-200 text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/20 text-cyan-400 group-hover:border-cyan-400/50 shrink-0">
                  <Puzzle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-200 group-hover:text-cyan-200">Plugins</div>
                  <div className="text-[10px] text-slate-400 truncate">Grounding & tool sandboxes</div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                {activePluginCount} Active
              </span>
            </button>

            {/* Divider */}
            <div className="border-t border-cyan-500/15 my-1" />

            {/* 'Think Harder' Extended Reasoning Mode */}
            <button
              type="button"
              onClick={() => {
                onToggleThinkHarder();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                thinkHarder
                  ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border border-cyan-400/40 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'hover:bg-cyan-950/40 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                    thinkHarder
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 animate-pulse'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <span>Think Harder</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {thinkHarder ? 'Deep Reasoning Active' : 'Extended reasoning mode'}
                  </div>
                </div>
              </div>

              {/* Toggle Switch Visual */}
              <div
                className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                  thinkHarder ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    thinkHarder ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
