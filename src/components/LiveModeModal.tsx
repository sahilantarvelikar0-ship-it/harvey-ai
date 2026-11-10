import React, { useRef, useState, useEffect } from 'react';
import {
  Radio,
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
  Sparkles,
  RefreshCw,
  Volume2,
  Scan,
  Send,
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer.tsx';

interface LiveModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendLivePrompt: (prompt: string, attachmentBase64?: string) => Promise<string | void>;
  isStreaming: boolean;
}

export const LiveModeModal: React.FC<LiveModeModalProps> = ({
  isOpen,
  onClose,
  onSendLivePrompt,
  isStreaming,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [harveyLastReply, setHarveyLastReply] = useState<string | null>(null);
  const [isAnalyzingFrame, setIsAnalyzingFrame] = useState(false);
  const [hudStatus, setHudStatus] = useState<'STANDBY' | 'LISTENING' | 'ANALYZING' | 'SPEAKING'>('STANDBY');

  // Initialize camera & speech when opened
  useEffect(() => {
    if (!isOpen) {
      cleanupStreams();
      return;
    }

    startLiveSession();

    return () => {
      cleanupStreams();
    };
  }, [isOpen]);

  const startLiveSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false, // audio handled via SpeechRecognition
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Live camera not available:', err);
      setCameraActive(false);
    }

    // Init continuous SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      recognizer.onresult = (event: any) => {
        let finalTxt = '';
        let interimTxt = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTxt += event.results[i][0].transcript;
          } else {
            interimTxt += event.results[i][0].transcript;
          }
        }

        const current = finalTxt || interimTxt;
        if (current) {
          setLiveTranscript(current);
          setHudStatus('LISTENING');
        }
      };

      recognizer.onerror = (e: any) => {
        console.warn('Live recognition error:', e);
      };

      try {
        recognizer.start();
        recognitionRef.current = recognizer;
        setMicActive(true);
        setHudStatus('LISTENING');
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  const cleanupStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  };

  // Capture current frame from camera as base64 JPEG
  const captureCurrentFrame = (): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Analyze live camera frame
  const handleAnalyzeFrame = async () => {
    if (isAnalyzingFrame) return;
    setIsAnalyzingFrame(true);
    setHudStatus('ANALYZING');

    const frameBase64 = captureCurrentFrame();
    const prompt =
      liveTranscript.trim() ||
      'Analyze what you see through my live camera right now, Sir. Highlight objects, text, or key observations.';

    try {
      await onSendLivePrompt(prompt, frameBase64 || undefined);
      setLiveTranscript('');
      setHudStatus('SPEAKING');
    } catch (err) {
      console.error('Live analysis failed:', err);
      setHudStatus('STANDBY');
    } finally {
      setIsAnalyzingFrame(false);
    }
  };

  // Send current spoken transcript
  const handleSendTranscript = async () => {
    if (!liveTranscript.trim() || isAnalyzingFrame) return;
    setIsAnalyzingFrame(true);
    setHudStatus('ANALYZING');
    const prompt = liveTranscript.trim();

    try {
      await onSendLivePrompt(prompt);
      setLiveTranscript('');
      setHudStatus('SPEAKING');
    } catch (err) {
      console.error('Live prompt failed:', err);
      setHudStatus('STANDBY');
    } finally {
      setIsAnalyzingFrame(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-fade-in text-slate-100 font-sans">
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[800px] flex flex-col rounded-3xl bg-[#050a16] border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden">
        {/* HUD Top Bar */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-cyan-500/20 bg-[#070e22]/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Radio className="w-5 h-5 animate-pulse text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono tracking-wider text-slate-100">
                  HARVEY LIVE INTERACTION
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">Real-time vision feed & continuous neural audio stream</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                cleanupStreams();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close Live HUD"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* HUD Main Area (Video Stream + Visualizer) */}
        <div className="relative flex-1 bg-black overflow-hidden flex flex-col justify-between">
          {/* Video or Audio Fallback */}
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover mirror opacity-85"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#050b18] via-[#040813] to-[#02050b] p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.2)] mb-4">
                <Radio className="w-10 h-10 text-cyan-400 animate-pulse" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">Audio Stream Active</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Speak directly to Harvey. Camera is currently off.
              </p>
            </div>
          )}

          {/* Futuristic HUD Scanning Grid Overlay */}
          <div className="pointer-events-none absolute inset-0">
            {/* Grid Lines */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
            />

            {/* Futuristic Corner HUD brackets */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <div className="absolute bottom-24 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <div className="absolute bottom-24 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />

            {/* Status Telemetry */}
            <div className="absolute top-6 left-16 flex items-center gap-2 bg-[#060e22]/80 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>STATUS: {hudStatus}</span>
              <span className="text-slate-600">·</span>
              <span>FPS: 30</span>
              <span className="text-slate-600">·</span>
              <span>NEURAL CORE: ONLINE</span>
            </div>
          </div>

          {/* Real-time Subtitle / Live Transcript Card */}
          <div className="relative z-10 m-4 sm:m-6 max-w-xl mx-auto w-full">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#060e22]/90 border border-cyan-500/30 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  <span>LIVE SPEECH INPUT</span>
                </span>
                <span className="text-slate-500">Auto-detected Language</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-100 min-h-[32px] leading-relaxed">
                {liveTranscript || (
                  <span className="text-slate-500 italic">
                    Listening to speech... say "Analyze this" or click 'Analyze Frame'
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Bottom Live Waveform Visualizer & Action Deck */}
          <div className="relative z-10 p-4 sm:p-6 bg-gradient-to-t from-[#040816] via-[#040816]/95 to-transparent">
            {/* Audio Waveform */}
            <div className="flex items-center justify-center mb-4">
              <AudioVisualizer active={true} label="Real-time Neural Audio Stream" />
            </div>

            {/* Primary Live Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Camera Toggle */}
              <button
                type="button"
                onClick={() => setCameraActive(!cameraActive)}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-2 text-xs font-medium min-h-[44px] ${
                  cameraActive
                    ? 'bg-cyan-950/80 border-cyan-400/50 text-cyan-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title={cameraActive ? 'Turn camera off' : 'Turn camera on'}
              >
                {cameraActive ? <Video className="w-4 h-4 text-cyan-400" /> : <VideoOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{cameraActive ? 'Camera On' : 'Camera Off'}</span>
              </button>

              {/* Analyze Live Frame (Main Action) */}
              <button
                type="button"
                disabled={isAnalyzingFrame}
                onClick={handleAnalyzeFrame}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(6,182,212,0.45)] active:scale-95 transition-all flex items-center gap-2 min-h-[44px]"
              >
                {isAnalyzingFrame ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Vision...</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    <span>Analyze Current Frame</span>
                  </>
                )}
              </button>

              {/* Send Transcript */}
              {liveTranscript.trim() && (
                <button
                  type="button"
                  disabled={isAnalyzingFrame}
                  onClick={handleSendTranscript}
                  className="p-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] min-h-[44px]"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
