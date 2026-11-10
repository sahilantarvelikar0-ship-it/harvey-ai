import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  AlertCircle,
  ArrowDown,
  Radio,
  FileText,
  X,
  BrainCircuit,
  Globe,
  Code2,
  FileSpreadsheet,
  Calculator,
} from 'lucide-react';
import { ChatMessage, SystemStatus, UserSession, StoredConversationSummary, AttachmentItem } from './types.ts';
import { Header } from './components/Header.tsx';
import { MessageItem } from './components/MessageItem.tsx';
import { QuickPrompts } from './components/QuickPrompts.tsx';
import { AudioVisualizer } from './components/AudioVisualizer.tsx';
import { AddMenu } from './components/AddMenu.tsx';
import { CameraCaptureModal } from './components/CameraCaptureModal.tsx';
import { LiveModeModal } from './components/LiveModeModal.tsx';
import { PluginsModal, PluginItem } from './components/PluginsModal.tsx';
import { PWAInstallBanner } from './components/PWAInstallBanner.tsx';
import { NavigationDrawer, HistoryItem } from './components/NavigationDrawer.tsx';

const DEFAULT_CONVERSATIONS: HistoryItem[] = [
  {
    id: 'conv-sample-1',
    title: 'Quantum encryption protocols & system specs',
    timestamp: 'Today 10:24 AM',
    updatedAt: Date.now() - 3600000,
    messages: [
      {
        id: 'msg-s1',
        role: 'user',
        content: 'Brief me on the quantum encryption protocols used in our architecture.',
        timestamp: '10:24 AM',
      },
      {
        id: 'msg-s2',
        role: 'assistant',
        content:
          'Certainly, Sir. The neural architecture leverages an AES-256-GCM authenticated cipher with dynamic IV generation, paired with scrypt work-factor 16384 key derivation.',
        timestamp: '10:24 AM',
      },
    ],
  },
  {
    id: 'conv-sample-2',
    title: 'Multi-lingual synthesis for Hindi & Marathi',
    timestamp: 'Yesterday 3:15 PM',
    updatedAt: Date.now() - 86400000,
    messages: [
      {
        id: 'msg-s3',
        role: 'user',
        content: 'मराठी आणि हिंदी मध्ये संवाद कसा साधायचा?',
        timestamp: '3:15 PM',
      },
      {
        id: 'msg-s4',
        role: 'assistant',
        content:
          'नमस्कार! मी हार्पर-प्रेरित हार्पर (HARVEY) आहे. मी मराठी, हिंदी, आणि इंग्रजी भाषेत सहज संवाद साधू शकतो.',
        timestamp: '3:15 PM',
      },
    ],
  },
  {
    id: 'conv-sample-3',
    title: 'Neural Core Diagnostics & Turbo Routing',
    timestamp: '2 days ago',
    updatedAt: Date.now() - 172800000,
    messages: [
      {
        id: 'msg-s5',
        role: 'user',
        content: 'Run a diagnostic check on current response latency.',
        timestamp: '11:02 AM',
      },
      {
        id: 'msg-s6',
        role: 'assistant',
        content:
          'Diagnostics complete, Sir. Response latency is currently optimized under 1.5 seconds with zero dropped packets.',
        timestamp: '11:02 AM',
      },
    ],
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'intro-msg',
    role: 'assistant',
    content:
      "Good day. I am **HARVEY**, your personal AI companion inspired by JARVIS.\n\nI am equipped with a **Security-First Architecture** and a **Universal Dynamic Multilingual Engine** supporting Marathi (मराठी), Spanish, French, German, Japanese, Proper Hindi (देवनागरी), Natural Hinglish, English, and all global languages.\n\nSpeak, type, attach files/images, or enter **Live Mode** with real-time video & voice interaction.\n\nHow may I assist you today, Sir?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    language: 'en',
  },
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('harvey_chat_session_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_MESSAGES;
  });

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>(() => `conv-${Date.now()}`);

  // Navigation Drawer & History State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('harvey_conversations_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_CONVERSATIONS;
  });

  // Multimodal & Extended Reasoning states
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [thinkHarder, setThinkHarder] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showPluginsModal, setShowPluginsModal] = useState(false);

  // Plugins state
  const [plugins, setPlugins] = useState<PluginItem[]>([
    {
      id: 'grounding',
      name: 'Live Web Grounding',
      description: 'Real-time Google search verification for up-to-date facts and data',
      icon: Globe,
      enabled: true,
      category: 'Grounding',
    },
    {
      id: 'code-sandbox',
      name: 'Algorithmic Sandbox',
      description: 'Computational code execution and algorithmic syntax verification',
      icon: Code2,
      enabled: true,
      category: 'Computation',
    },
    {
      id: 'data-analyzer',
      name: 'Document & Table Parser',
      description: 'Deep structural analysis for CSV, JSON, and PDF documents',
      icon: FileSpreadsheet,
      enabled: true,
      category: 'Analysis',
    },
    {
      id: 'math-rigor',
      name: 'Mathematical Precision',
      description: 'Multi-step verification for complex formulas and proofs',
      icon: Calculator,
      enabled: false,
      category: 'Logic',
    },
  ]);

  const [status, setStatus] = useState<SystemStatus>({
    status: 'checking',
    name: 'HARVEY',
    model: 'gemini-3.8-flash',
    hasApiKey: true,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync session in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('harvey_chat_session_v4', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Check system status on mount
  useEffect(() => {
    const initApp = async () => {
      const startTime = performance.now();
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        const latency = Math.round(performance.now() - startTime);
        setStatus({
          status: 'online',
          name: data.name || 'HARVEY',
          model: data.model || 'gemini-3.8-flash',
          hasApiKey: data.hasApiKey ?? true,
          latency,
          security: data.security,
        });
      } catch (err) {
        console.warn('Could not contact Harvey server:', err);
        setStatus(prev => ({ ...prev, status: 'offline' }));
      }
    };

    initApp();
  }, []);

  // Initialize SpeechRecognition if available
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = 'en-US';

      recognizer.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognizer.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognizer.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognizer;
    }
  }, []);

  // Scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Handle scroll listener to show scroll-to-bottom button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isFarFromBottom);
  };

  // Text-To-Speech handler supporting all global languages dynamically
  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (currentlySpeakingText === text && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingText(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[*_#`[\]()]/g, '')
      .replace(/```[\s\S]*?```/g, 'Code block omitted.');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();

    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(cleanText)) {
      utterance.lang = 'ja-JP';
      const v = voices.find(vo => vo.lang.includes('ja'));
      if (v) utterance.voice = v;
    } else if (/[\uAC00-\uD7AF]/.test(cleanText)) {
      utterance.lang = 'ko-KR';
      const v = voices.find(vo => vo.lang.includes('ko'));
      if (v) utterance.voice = v;
    } else if (/[\u4E00-\u9FFF]/.test(cleanText)) {
      utterance.lang = 'zh-CN';
      const v = voices.find(vo => vo.lang.includes('zh'));
      if (v) utterance.voice = v;
    } else if (/[\u0600-\u06FF]/.test(cleanText)) {
      utterance.lang = 'ar-SA';
      const v = voices.find(vo => vo.lang.includes('ar'));
      if (v) utterance.voice = v;
    } else if (/[\u0400-\u04FF]/.test(cleanText)) {
      utterance.lang = 'ru-RU';
      const v = voices.find(vo => vo.lang.includes('ru'));
      if (v) utterance.voice = v;
    } else if (/[\u0900-\u097F]/.test(cleanText)) {
      const isMarathi = /(?:^|[\s,।?.!])(आहे|आहात|कसे|काय|चाललंय|सांगा|माहिती|करा|नमस्कार|धन्यवाद)(?:$|[\s,।?.!])/.test(
        cleanText
      );
      if (isMarathi) {
        utterance.lang = 'mr-IN';
        const v = voices.find(vo => vo.lang.includes('mr') || vo.lang.includes('mar'));
        if (v) utterance.voice = v;
        else {
          const hv = voices.find(vo => vo.lang.includes('hi'));
          if (hv) utterance.voice = hv;
        }
      } else {
        utterance.lang = 'hi-IN';
        const v = voices.find(vo => vo.lang.includes('hi') || vo.name.toLowerCase().includes('hindi'));
        if (v) utterance.voice = v;
      }
    } else if (/[¿¡]|\b(hola|cómo|gracias|señor|señora)\b/i.test(cleanText)) {
      utterance.lang = 'es-ES';
      const v = voices.find(vo => vo.lang.includes('es'));
      if (v) utterance.voice = v;
    } else if (/[çœ]|\b(bonjour|merci|monsieur|madame)\b/i.test(cleanText)) {
      utterance.lang = 'fr-FR';
      const v = voices.find(vo => vo.lang.includes('fr'));
      if (v) utterance.voice = v;
    } else if (/[äöüß]|\b(guten|danke|bitte)\b/i.test(cleanText)) {
      utterance.lang = 'de-DE';
      const v = voices.find(vo => vo.lang.includes('de'));
      if (v) utterance.voice = v;
    } else {
      utterance.lang = 'en-US';
      const preferredVoice = voices.find(
        vo =>
          (vo.lang.includes('en-GB') || vo.lang.includes('en-US')) &&
          (vo.name.includes('Natural') || vo.name.includes('Google') || vo.name.includes('Daniel'))
      );
      if (preferredVoice) utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setCurrentlySpeakingText(text);
    utterance.onend = () => setCurrentlySpeakingText(null);
    utterance.onerror = () => setCurrentlySpeakingText(null);

    window.speechSynthesis.speak(utterance);
  };

  // Microphone toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type your message in any language.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition', err);
        setIsListening(false);
      }
    }
  };

  // File upload reader
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = event => {
        const base64 = event.target?.result as string;
        const isImg = file.type.startsWith('image/');
        const newAttachment: AttachmentItem = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          type: file.type || (isImg ? 'image/jpeg' : 'application/octet-stream'),
          size: file.size,
          base64,
          previewUrl: isImg ? base64 : undefined,
          isImage: isImg,
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  // Submit message with multimodal attachments & reasoning mode
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if ((!prompt && attachments.length === 0) || isStreaming) return;

    setErrorMessage(null);
    setInput('');
    const currentAttachments = [...attachments];
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt || (currentAttachments.length > 0 ? 'Analyze attached file/image.' : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Prepare assistant placeholder message
    const assistantId = `harvey-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages([...newMessages, initialAssistantMessage]);
    setIsStreaming(true);

    try {
      const payloadMessages = newMessages.slice(-8).map(m => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

      let accumulatedText = '';
      let detectedLangName = '';

      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: payloadMessages,
            conversationId: currentConversationId,
            attachments: currentAttachments,
            thinkHarder,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('Streaming body not available');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const rawLines = buffer.split(/\r?\n/);
          buffer = rawLines.pop() || '';

          for (const rawLine of rawLines) {
            const line = rawLine.trim();
            if (!line || !line.startsWith('data:')) continue;
            const dataContent = line.slice(5).trim();

            if (dataContent === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(dataContent);
              if (parsed.error) {
                throw new Error(parsed.error);
              }

              if (parsed.meta?.detectedLanguage) {
                detectedLangName = parsed.meta.detectedLanguage;
              }

              if (parsed.text) {
                accumulatedText += parsed.text;
                setMessages(currentMessages =>
                  currentMessages.map(m =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content: accumulatedText,
                          isStreaming: true,
                          detectedLanguage: detectedLangName || m.detectedLanguage,
                        }
                      : m
                  )
                );
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      } catch (streamErr) {
        console.warn('Stream failed or was interrupted, falling back to /api/chat:', streamErr);
      }

      // If streaming didn't return any text, attempt non-streaming fallback
      if (!accumulatedText.trim()) {
        try {
          const fallbackRes = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: payloadMessages,
            }),
          });

          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            if (data.content) {
              accumulatedText = data.content;
              if (data.meta?.detectedLanguage) {
                detectedLangName = data.meta.detectedLanguage;
              }
            }
          }
        } catch (fallbackErr) {
          console.error('Non-streaming fallback failed:', fallbackErr);
        }
      }

      if (!accumulatedText.trim()) {
        throw new Error('Harvey could not generate a response. Please check your network and try again.');
      }

      // Finalize assistant message
      setMessages(currentMessages =>
        currentMessages.map(m =>
          m.id === assistantId
            ? {
                ...m,
                content: accumulatedText,
                isStreaming: false,
                detectedLanguage: detectedLangName || m.detectedLanguage,
              }
            : m
        )
      );

      // Auto-narrate if enabled
      if (autoSpeak && accumulatedText) {
        handleSpeak(accumulatedText);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to Harvey';
      console.error('Harvey chat error:', msg);
      setErrorMessage(msg);
      setMessages(currentMessages =>
        currentMessages.map(m =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  m.content ||
                  "I apologize, but I encountered an issue communicating with my neural core. Please verify your connection or check your system status.",
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Handle prompt from Live Mode
  const handleSendLivePrompt = async (prompt: string, attachmentBase64?: string) => {
    let liveAttachments: AttachmentItem[] | undefined;
    if (attachmentBase64) {
      liveAttachments = [
        {
          id: `live-snap-${Date.now()}`,
          name: 'live-camera-frame.jpg',
          type: 'image/jpeg',
          size: Math.round((attachmentBase64.length * 3) / 4),
          base64: attachmentBase64,
          previewUrl: attachmentBase64,
          isImage: true,
        },
      ];
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: liveAttachments,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    const assistantId = `harvey-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages([...newMessages, initialAssistantMessage]);
    setIsStreaming(true);

    try {
      const payloadMessages = newMessages.slice(-8).map(m => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: payloadMessages,
          conversationId: currentConversationId,
          attachments: liveAttachments,
          thinkHarder,
        }),
      });

      if (!response.body) throw new Error('Streaming body not available');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataContent = trimmed.replace(/^data:\s*/, '');
          if (dataContent === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataContent);
            if (parsed.text) {
              accumulatedText += parsed.text;
              setMessages(currentMessages =>
                currentMessages.map(m =>
                  m.id === assistantId ? { ...m, content: accumulatedText, isStreaming: true } : m
                )
              );
            }
          } catch {
            // ignore
          }
        }
      }

      setMessages(currentMessages =>
        currentMessages.map(m =>
          m.id === assistantId ? { ...m, content: accumulatedText, isStreaming: false } : m
        )
      );

      // Speak live answer automatically
      if (accumulatedText) {
        handleSpeak(accumulatedText);
      }
    } catch (err) {
      console.error('Live prompt streaming error:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  // Textarea keypress
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize input textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  // Sync conversation history into dynamic history list
  useEffect(() => {
    if (messages.length <= 1) return;

    const firstUserMsg = messages.find(m => m.role === 'user');
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 48) + (firstUserMsg.content.length > 48 ? '...' : '')
      : 'Active session';

    setConversations(prev => {
      const existingIndex = prev.findIndex(c => c.id === currentConversationId);
      const updatedItem: HistoryItem = {
        id: currentConversationId,
        title,
        timestamp: 'Just now',
        messages,
        updatedAt: Date.now(),
      };

      let newHistory: HistoryItem[];
      if (existingIndex >= 0) {
        newHistory = [...prev];
        newHistory[existingIndex] = updatedItem;
      } else {
        newHistory = [updatedItem, ...prev];
      }

      try {
        localStorage.setItem('harvey_conversations_v4', JSON.stringify(newHistory.slice(0, 40)));
      } catch {
        // ignore
      }
      return newHistory;
    });
  }, [messages, currentConversationId]);

  // Reset chat session
  const handleNewSession = (force: boolean = false) => {
    if (force || messages.length <= 1 || window.confirm('Start fresh conversation session with Harvey?')) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setMessages(INITIAL_MESSAGES);
      setAttachments([]);
      setCurrentConversationId(`conv-${Date.now()}`);
      sessionStorage.removeItem('harvey_chat_session_v4');
      setErrorMessage(null);
    }
  };

  const handleSelectConversation = (id: string) => {
    const target = conversations.find(c => c.id === id);
    if (target) {
      setCurrentConversationId(target.id);
      setMessages(target.messages);
      setAttachments([]);
      setErrorMessage(null);
    }
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      try {
        localStorage.setItem('harvey_conversations_v4', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    if (currentConversationId === id) {
      handleNewSession(true);
    }
  };

  const handleTogglePlugin = (id: string) => {
    setPlugins(prev =>
      prev.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#050811] text-slate-100 overflow-hidden font-sans selection:bg-cyan-500/25 selection:text-cyan-200">
      {/* Background Arc Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-900/15 blur-[100px]" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-blue-900/15 blur-[120px]" />
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[300px] rounded-full bg-cyan-950/20 blur-[130px]" />
      </div>

      {/* Futuristic Grid Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Header with 3-Dots Menu button on top-right */}
      <Header
        status={status}
        onNewSession={handleNewSession}
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
        isStreaming={isStreaming}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* PWA Install Banner (Displays install prompt on mobile/desktop browsers or iOS Safari guide) */}
      <PWAInstallBanner />

      {/* Main Chat Viewport */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
      >
        <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-between">
          {/* Messages list */}
          <div className="space-y-1">
            {messages.map(msg => (
              <MessageItem
                key={msg.id}
                message={msg}
                onSpeak={handleSpeak}
                isSpeakingThis={currentlySpeakingText === msg.content}
              />
            ))}

            {/* Quick Starter Prompts if single intro message */}
            {messages.length === 1 && !isStreaming && (
              <QuickPrompts onSelectPrompt={prompt => handleSendMessage(prompt)} />
            )}

            {/* Active streaming visualizer bar */}
            {isStreaming && (
              <div className="flex items-center justify-start my-3 pl-10 animate-fade-in">
                <AudioVisualizer active={true} label="Harvey is formulating response..." />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Scroll to bottom button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="fixed bottom-24 right-6 z-30 p-2.5 rounded-full bg-cyan-950/90 border border-cyan-400/40 text-cyan-300 shadow-lg hover:bg-cyan-900 transition-all hover:scale-105 active:scale-95"
          title="Scroll to bottom"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Error alert toast */}
      {errorMessage && (
        <div className="relative z-20 max-w-2xl mx-auto px-4 w-full mb-2">
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 font-bold px-2 py-0.5"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input Section (Sticky Bottom with Modern Multimodal Controls) */}
      <footer className="relative z-20 w-full bg-[#060a17]/95 border-t border-cyan-500/15 backdrop-blur-xl p-3 sm:p-4 pb-safe">
        <div className="max-w-4xl mx-auto">
          {/* Active Mode Indicators & Attachment Previews */}
          {(thinkHarder || attachments.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mb-2 px-1 animate-fade-in">
              {/* 'Think Harder' Reasoning Mode Active Pill */}
              {thinkHarder && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-[11px] font-mono shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                  <BrainCircuit className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>Think Harder Active (Extended Reasoning Depth)</span>
                  <button
                    type="button"
                    onClick={() => setThinkHarder(false)}
                    className="ml-1 hover:text-white p-0.5"
                    title="Turn off extended reasoning"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Uploaded Attachment Chips */}
              {attachments.map(att => (
                <div
                  key={att.id}
                  className="inline-flex items-center gap-2 p-1 pl-2 pr-2 rounded-xl bg-[#09152e] border border-cyan-500/30 text-xs text-slate-200 shadow-sm"
                >
                  {att.isImage ? (
                    <img
                      src={att.previewUrl || att.base64}
                      alt={att.name}
                      className="w-5 h-5 rounded object-cover"
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-cyan-400" />
                  )}
                  <span className="truncate max-w-[130px] text-[11px] font-mono">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="text-slate-400 hover:text-rose-400 p-0.5 transition-colors"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main Input Box Container */}
          <div className="relative flex items-end gap-1.5 sm:gap-2 bg-[#091124] border border-cyan-500/30 rounded-2xl p-1.5 sm:p-2 focus-within:border-cyan-400/70 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all">
            {/* 1. Left '+ (Add)' Popup Menu */}
            <AddMenu
              isOpen={isAddMenuOpen}
              onClose={() => setIsAddMenuOpen(false)}
              onToggleOpen={() => setIsAddMenuOpen(!isAddMenuOpen)}
              onSelectCamera={() => setShowCameraModal(true)}
              onSelectPhotos={() => photosInputRef.current?.click()}
              onSelectFiles={() => filesInputRef.current?.click()}
              onOpenPlugins={() => setShowPluginsModal(true)}
              thinkHarder={thinkHarder}
              onToggleThinkHarder={() => setThinkHarder(!thinkHarder)}
              activePluginCount={plugins.filter(p => p.enabled).length}
            />

            {/* Hidden native file inputs for Photos and Documents */}
            <input
              type="file"
              ref={photosInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            <input
              type="file"
              ref={filesInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.txt,.csv,.md,.json,.js,.ts,.py,.html,.css,.doc,.docx"
              multiple
              className="hidden"
            />

            {/* 2. Textarea - Strictly placeholder 'Ask Harvey...' */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening to speech...' : 'Ask Harvey...'}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base resize-none focus:outline-none max-h-36 py-2 px-1 leading-relaxed"
            />

            {/* 3. Right Action Buttons: Live Mode, Microphone, Send */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pb-0.5">
              {/* 'Live' mode button with waveform/video icon */}
              <button
                type="button"
                onClick={() => setShowLiveModal(true)}
                className="min-h-[42px] px-2.5 sm:px-3 rounded-xl flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-950/90 to-blue-950/90 hover:from-cyan-900/90 hover:to-blue-900/90 border border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)] transition-all active:scale-95 group"
                title="Enter Live Audio & Video Interaction Mode"
                aria-label="Live Interaction Mode"
              >
                <Radio className="w-4 h-4 text-cyan-400 group-hover:animate-pulse" />
                <span className="font-mono text-xs font-bold tracking-wider">Live</span>
              </button>

              {/* Dictation / Microphone button (Moved to the right side of input field) */}
              <button
                type="button"
                onClick={toggleListening}
                className={`min-h-[42px] min-w-[42px] rounded-xl flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-400/50 animate-pulse'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/50'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Dictate with speech'}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              >
                <Mic className={`w-4 h-4 ${isListening ? 'text-rose-400' : ''}`} />
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={(!input.trim() && attachments.length === 0) || isStreaming}
                className={`min-h-[42px] min-w-[42px] sm:px-3.5 rounded-xl flex items-center justify-center gap-1.5 font-medium text-xs sm:text-sm transition-all ${
                  (input.trim() || attachments.length > 0) && !isStreaming
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:from-cyan-400 hover:to-blue-400 active:scale-[0.97]'
                    : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-700/40'
                }`}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>

          {/* Bottom subtle metadata */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400/70" />
              <span>Model: Gemini 3.8 Flash</span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span>Vision & Multimodal</span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span>Universal Multilingual</span>
            </div>
            <div className="hidden sm:block text-slate-500">
              Press <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px]">Shift</kbd> + <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px]">Enter</kbd> for newline
            </div>
          </div>
        </div>
      </footer>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={attachment => setAttachments(prev => [...prev, attachment])}
      />

      {/* Live Mode HUD Modal */}
      <LiveModeModal
        isOpen={showLiveModal}
        onClose={() => setShowLiveModal(false)}
        onSendLivePrompt={handleSendLivePrompt}
        isStreaming={isStreaming}
      />

      {/* Plugins Modal */}
      <PluginsModal
        isOpen={showPluginsModal}
        onClose={() => setShowPluginsModal(false)}
        plugins={plugins}
        onTogglePlugin={handleTogglePlugin}
      />

      {/* Side Navigation Drawer sliding smoothly from the Right */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNewChat={() => handleNewSession(true)}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        userName="Sahil Antarvelikar"
        userEmail="sahilantarvelikar@gmail.com"
      />
    </div>
  );
}
