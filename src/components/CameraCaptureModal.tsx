import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { AttachmentItem } from '../types.ts';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (attachment: AttachmentItem) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  // Start webcam when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPreview(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setIsLoading(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsLoading(false);
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      setIsLoading(false);
      setCameraError(
        'Unable to access camera. Please check browser camera permissions or ensure no other app is using it.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPreview(dataUrl);
  };

  const handleRetake = () => {
    setCapturedPreview(null);
  };

  const handleAcceptCapture = () => {
    if (!capturedPreview) return;
    const base64Data = capturedPreview;
    // Calculate approximate size
    const size = Math.round((base64Data.length * 3) / 4);

    const attachment: AttachmentItem = {
      id: `cam-${Date.now()}`,
      name: `camera-snapshot-${Date.now()}.jpg`,
      type: 'image/jpeg',
      size,
      base64: base64Data,
      previewUrl: base64Data,
      isImage: true,
    };

    onCapture(attachment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#070e1e] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-[#081328]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-slate-100 font-mono">
                HARVEY VISION CAPTURE
              </h3>
              <p className="text-[11px] text-slate-400">Capture visual context for multimodal AI analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-xs text-rose-300 max-w-sm space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="font-semibold">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-3.5 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500/30 text-rose-200 text-xs hover:bg-rose-900 transition-colors"
              >
                Retry Camera
              </button>
            </div>
          ) : capturedPreview ? (
            <img src={capturedPreview} alt="Captured Snapshot" className="w-full h-full object-cover" />
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 text-cyan-300 text-xs gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to visual feed...</span>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />

              {/* Futuristic HUD overlay reticle */}
              <div className="pointer-events-none absolute inset-0 border border-cyan-500/20">
                {/* Corner markers */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

                {/* Center crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-cyan-400/40 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                </div>

                <div className="absolute top-3 left-10 text-[9px] font-mono tracking-widest text-cyan-400/80 uppercase">
                  REC // SENSOR ACTIVE
                </div>
              </div>
            </>
          )}
        </div>

        {/* Controls Footer */}
        <div className="p-4 border-t border-cyan-500/20 bg-[#081328] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors min-h-[44px]"
          >
            Cancel
          </button>

          {capturedPreview ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetake}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors min-h-[44px]"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={handleAcceptCapture}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.35)] min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                <span>Attach to Message</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isLoading || Boolean(cameraError)}
              onClick={handleSnap}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all min-h-[44px]"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Snapshot</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
