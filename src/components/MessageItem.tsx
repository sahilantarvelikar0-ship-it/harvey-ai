import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Volume2, VolumeX, User, FileText, BrainCircuit } from 'lucide-react';
import { ChatMessage } from '../types.ts';
import { HarveyLogo } from './HarveyLogo.tsx';

interface MessageItemProps {
  message: ChatMessage;
  onSpeak?: (text: string) => void;
  isSpeakingThis?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onSpeak,
  isSpeakingThis = false,
}) => {
  const [copied, setCopied] = useState(false);
  const isHarvey = message.role === 'assistant';

  // Smooth typewriter state for streaming messages
  const [displayedContent, setDisplayedContent] = useState(() =>
    message.isStreaming ? '' : message.content
  );
  const contentRef = useRef(message.content);
  contentRef.current = message.content;

  useEffect(() => {
    // If not streaming or already finished, snap to full content
    if (!message.isStreaming) {
      setDisplayedContent(message.content);
      return;
    }

    let animationFrameId: number;
    let lastTick = performance.now();

    const stepTypewriter = (now: number) => {
      const target = contentRef.current;
      const current = displayedContent;

      if (current.length < target.length) {
        const delta = target.length - current.length;
        const elapsed = now - lastTick;
        if (elapsed >= 18) {
          lastTick = now;
          let step = 1;
          if (delta > 80) step = 8;
          else if (delta > 40) step = 4;
          else if (delta > 20) step = 2;

          let nextLength = Math.min(target.length, current.length + step);
          setDisplayedContent(target.slice(0, nextLength));
        }
      }

      animationFrameId = requestAnimationFrame(stepTypewriter);
    };

    animationFrameId = requestAnimationFrame(stepTypewriter);
    return () => cancelAnimationFrame(animationFrameId);
  }, [message.isStreaming, displayedContent.length]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const textToRender = message.isStreaming ? displayedContent : message.content;

  return (
    <div
      className={`group flex gap-3.5 my-3.5 transition-all duration-300 animate-message-in ${
        isHarvey ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Harvey Avatar */}
      {isHarvey && (
        <div className="pt-0.5 shrink-0">
          <HarveyLogo size="sm" isThinking={message.isStreaming} />
        </div>
      )}

      {/* Message Bubble Container */}
      <div
        className={`relative max-w-[88%] sm:max-w-[80%] md:max-w-[72%] rounded-2xl p-4 transition-all duration-200 ${
          isHarvey
            ? 'bg-[#091124]/90 border border-cyan-500/25 text-slate-100 shadow-[0_4px_24px_rgba(6,182,212,0.06)] backdrop-blur-md'
            : 'bg-[#12223e] border border-blue-400/25 text-slate-100 ml-auto shadow-[0_2px_14px_rgba(30,58,138,0.25)]'
        }`}
      >
        {/* Header Metadata */}
        <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/5 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-medium">
            <span
              className={
                isHarvey
                  ? 'text-cyan-400 tracking-wider font-semibold font-mono text-[12px]'
                  : 'text-sky-300'
              }
            >
              {isHarvey ? 'HARVEY' : 'You'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono text-[11px] text-slate-500">{message.timestamp}</span>
            {message.detectedLanguage && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/70 border border-cyan-500/20 text-cyan-300">
                  {message.detectedLanguage}
                </span>
              </>
            )}
          </div>

          {/* Action buttons (Copy & Speak for Harvey) */}
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {isHarvey && onSpeak && (
              <button
                type="button"
                onClick={() => onSpeak(message.content)}
                className={`p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors ${
                  isSpeakingThis ? 'text-cyan-300 bg-cyan-500/20 animate-pulse' : ''
                }`}
                title={isSpeakingThis ? 'Stop narration' : 'Listen with voice'}
                aria-label={isSpeakingThis ? 'Stop audio narration' : 'Play audio narration'}
              >
                {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
              title="Copy response"
              aria-label="Copy text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Attachment Previews if any */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2.5">
            {message.attachments.map(att => (
              <div
                key={att.id}
                className="rounded-xl overflow-hidden border border-cyan-500/30 bg-[#060e22] max-w-xs shadow-md"
              >
                {att.isImage || att.type.startsWith('image/') ? (
                  <img
                    src={att.previewUrl || att.base64}
                    alt={att.name}
                    className="max-h-48 w-auto object-cover rounded-lg"
                  />
                ) : (
                  <div className="p-2.5 flex items-center gap-2 text-xs text-slate-300">
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate max-w-[160px] font-mono text-[11px]">{att.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content Body with Typewriter Rendering */}
        <div className="text-[15px] leading-relaxed text-slate-200 break-words space-y-2">
          {isHarvey ? (
            <div className="prose prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-headings:text-cyan-200 prose-headings:font-semibold prose-code:font-mono prose-code:text-cyan-300 prose-code:bg-cyan-950/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded max-w-none text-slate-200">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <div className="my-2 rounded-lg overflow-hidden border border-cyan-500/30 bg-[#050b18]">
                        <div className="flex items-center justify-between px-3 py-1 bg-cyan-950/40 border-b border-cyan-500/20 text-xs text-cyan-300 font-mono">
                          <span>{match[1]}</span>
                        </div>
                        <pre className="p-3 overflow-x-auto text-xs text-slate-200 font-mono">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-cyan-950/50 text-cyan-300 px-1 py-0.5 rounded text-[13px] font-mono" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {textToRender}
              </ReactMarkdown>

              {/* Glowing Typewriter Caret while streaming */}
              {message.isStreaming && (
                <span
                  className="inline-block w-2 h-4 ml-1 bg-cyan-400 rounded-sm animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)] align-middle"
                  aria-hidden="true"
                />
              )}
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {!isHarvey && (
        <div className="pt-0.5 shrink-0">
          <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-200 shadow-sm">
            <User className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
};
