import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Bell,
  MessageSquarePlus,
  BookOpen,
  Image as ImageIcon,
  Clock,
  GraduationCap,
  Sliders,
  Video,
  Plus,
  Trash2,
  Settings,
  Sparkles,
  Check,
  ChevronRight,
  Notebook,
  FolderPlus,
  Shield,
  Volume2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { ChatMessage } from '../types.ts';

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface NotebookItem {
  id: string;
  title: string;
  itemCount: number;
  updatedAt: string;
}

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  conversations: HistoryItem[];
  currentConversationId: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  userEmail?: string;
  userName?: string;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  onNewChat,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  userEmail = 'sahilantarvelikar@gmail.com',
  userName = 'Sahil Antarvelikar',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTabModal, setActiveTabModal] = useState<string | null>(null);

  // Notebooks state
  const [notebooks, setNotebooks] = useState<NotebookItem[]>([
    { id: 'nb-1', title: 'Neural Directives & Prompt Rules', itemCount: 4, updatedAt: 'Today' },
    { id: 'nb-2', title: 'System Architecture & Security', itemCount: 7, updatedAt: 'Yesterday' },
    { id: 'nb-3', title: 'Language Synthesis Notes', itemCount: 3, updatedAt: '2 days ago' },
  ]);
  const [isAddingNotebook, setIsAddingNotebook] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState('');

  // Notifications
  const [notificationList, setNotificationList] = useState([
    { id: 'notif-1', title: 'Model Routing Optimized', desc: 'gemini-3.1-flash-lite active for sub-second responses.', time: 'Just now', unread: true },
    { id: 'notif-2', title: 'PWA Mobile Support Ready', desc: 'Offline standalone caching enabled for iOS & Android.', time: '10m ago', unread: true },
    { id: 'notif-3', title: 'Encrypted Vault Protected', desc: 'AES-256-GCM cipher active on all session payloads.', time: '1h ago', unread: false },
  ]);

  const drawerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus search input when toggled
  useEffect(() => {
    if (showSearchInput && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchInput]);

  // Filter history conversations
  const filteredHistory = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNotebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotebookTitle.trim()) return;
    const newNb: NotebookItem = {
      id: `nb-${Date.now()}`,
      title: newNotebookTitle.trim(),
      itemCount: 0,
      updatedAt: 'Just now',
    };
    setNotebooks([newNb, ...notebooks]);
    setNewNotebookTitle('');
    setIsAddingNotebook(false);
  };

  const navItems = [
    {
      id: 'new-chat',
      label: 'New chat',
      icon: MessageSquarePlus,
      highlight: true,
      action: () => {
        onNewChat();
        onClose();
      },
    },
    {
      id: 'library',
      label: 'Library',
      icon: BookOpen,
      count: '14',
      action: () => setActiveTabModal('Library'),
    },
    {
      id: 'images',
      label: 'Images',
      icon: ImageIcon,
      count: 'Visuals',
      action: () => setActiveTabModal('Images'),
    },
    {
      id: 'scheduled',
      label: 'Scheduled',
      icon: Clock,
      count: '2',
      action: () => setActiveTabModal('Scheduled'),
    },
    {
      id: 'students',
      label: 'Students',
      icon: GraduationCap,
      count: 'Study',
      action: () => setActiveTabModal('Students'),
    },
    {
      id: 'customise',
      label: 'Customise',
      icon: Sliders,
      action: () => setActiveTabModal('Customise'),
    },
    {
      id: 'videos',
      label: 'Videos',
      icon: Video,
      count: 'Live',
      action: () => setActiveTabModal('Videos'),
    },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Side Navigation Drawer sliding from the Right */}
      <aside
        ref={drawerRef}
        aria-label="Navigation drawer"
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[380px] max-w-full bg-[#070c1a] border-l border-cyan-500/25 shadow-[-12px_0_40px_rgba(0,0,0,0.85)] flex flex-col transition-transform duration-300 ease-out select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 1. TOP HEADER INSIDE MENU: Title "HARVEY" with Search, Notifications, and Close icons */}
        <div className="shrink-0 h-16 px-4 sm:px-5 border-b border-cyan-500/20 bg-[#060a16]/90 backdrop-blur-md flex items-center justify-between gap-3">
          {/* Title HARVEY */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <span className="font-mono font-black text-xs text-cyan-300">H</span>
            </div>
            <div>
              <span className="font-mono font-black text-lg tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 via-white to-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                HARVEY
              </span>
              <span className="ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 uppercase">
                v3.8
              </span>
            </div>
          </div>

          {/* Action Icons: Search, Notifications, Close */}
          <div className="flex items-center gap-1">
            {/* Search Icon */}
            <button
              onClick={() => setShowSearchInput(!showSearchInput)}
              className={`p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors ${
                showSearchInput ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : ''
              }`}
              title="Search conversations & notebooks"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notifications Icon with Badge */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors ${
                  showNotifications ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : ''
                }`}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notificationList.some(n => n.unread) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.9)] animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotifications && (
                <div className="absolute top-12 right-0 z-50 w-72 rounded-2xl bg-[#091124] border border-cyan-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.8)] p-3 text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-cyan-500/15 mb-2">
                    <span className="font-mono font-bold text-cyan-300 tracking-wider text-[11px] uppercase">
                      System Notifications
                    </span>
                    <button
                      onClick={() =>
                        setNotificationList(prev => prev.map(n => ({ ...n, unread: false })))
                      }
                      className="text-[10px] text-slate-400 hover:text-cyan-300"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {notificationList.map(item => (
                      <div
                        key={item.id}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          item.unread
                            ? 'bg-cyan-950/40 border-cyan-500/30 text-slate-200'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold text-[11px] text-cyan-200">
                          <span>{item.title}</span>
                          <span className="text-[9px] text-slate-500">{item.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Close Icon (Dismiss Drawer) */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors ml-0.5"
              title="Close menu (ESC)"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar (Expandable) */}
        {showSearchInput && (
          <div className="px-4 py-2.5 bg-slate-950/60 border-b border-cyan-500/15 animate-in fade-in">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-3.5 h-3.5 text-cyan-400/70" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search chats, notes, and topics..."
                className="w-full bg-[#0a1428] border border-cyan-500/30 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Center Content Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* 2. NAVIGATION ITEMS: New chat, Library, Images, Scheduled, Students, Customise, Videos */}
          <div className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    item.highlight
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:border-cyan-400'
                      : 'text-slate-300 hover:text-cyan-200 hover:bg-[#0c1833] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        item.highlight ? 'text-cyan-300' : 'text-slate-400 group-hover:text-cyan-300'
                      }`}
                    />
                    <span className="tracking-wide">{item.label}</span>
                  </div>

                  {item.count && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-cyan-500/20 text-cyan-400 group-hover:border-cyan-400/40">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-cyan-500/15" />

          {/* 3. NOTEBOOKS SECTION: "+ New notebook" button */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="font-mono text-[10px] font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
                <Notebook className="w-3.5 h-3.5" />
                Notebooks
              </span>
              <button
                onClick={() => setIsAddingNotebook(!isAddingNotebook)}
                className="text-[10px] font-mono font-semibold text-cyan-400 hover:text-cyan-200 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-cyan-950/60 transition-colors"
                title="Create a new notebook"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>

            {/* Inline Add Notebook form */}
            {isAddingNotebook && (
              <form onSubmit={handleCreateNotebook} className="mb-2 p-2 rounded-xl bg-[#0a1428] border border-cyan-500/30">
                <input
                  type="text"
                  autoFocus
                  value={newNotebookTitle}
                  onChange={e => setNewNotebookTitle(e.target.value)}
                  placeholder="Notebook title..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 mb-2"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNotebook(false);
                      setNewNotebookTitle('');
                    }}
                    className="px-2 py-1 rounded text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] shadow-sm"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {/* Notebooks List */}
            <div className="space-y-1">
              {notebooks.map(nb => (
                <div
                  key={nb.id}
                  onClick={() => setActiveTabModal(`Notebook: ${nb.title}`)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-cyan-200 hover:bg-[#0c1833] cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 group-hover:bg-cyan-300 shrink-0" />
                    <span className="truncate">{nb.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {nb.itemCount} notes
                  </span>
                </div>
              ))}

              {/* + New notebook dedicated button */}
              <button
                type="button"
                onClick={() => setIsAddingNotebook(true)}
                className="w-full mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl text-xs border border-dashed border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/30 transition-all font-mono"
              >
                <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ New notebook</span>
              </button>
            </div>
          </div>

          <div className="border-t border-cyan-500/15" />

          {/* 4. HISTORY LIST (Under "All" section): Dynamic chat history / recent conversations */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="font-mono text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
                All ({filteredHistory.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Recent sessions</span>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-6 px-4 text-xs text-slate-500">
                {searchQuery ? 'No matching conversations found.' : 'No recent chat history.'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredHistory.map(conv => {
                  const isActive = conv.id === currentConversationId;
                  return (
                    <div
                      key={conv.id}
                      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-950/70 to-blue-950/60 border border-cyan-500/40 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                          : 'text-slate-300 hover:text-slate-100 hover:bg-[#0c1833] border border-transparent'
                      }`}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        onClose();
                      }}
                    >
                      <div className="min-w-0 pr-2 flex-1">
                        <p className="font-medium truncate tracking-wide">{conv.title}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                          {conv.timestamp} · {conv.messages.length} msgs
                        </p>
                      </div>

                      {/* Delete Conversation action button */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (window.confirm(`Delete conversation "${conv.title}"?`)) {
                            onDeleteConversation(conv.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all shrink-0"
                        title="Delete chat"
                        aria-label="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 5. BOTTOM PROFILE BAR: User profile info at bottom left, Upgrade button, and Settings gear icon on bottom right */}
        <div className="shrink-0 p-3 sm:p-3.5 bg-[#050914] border-t border-cyan-500/20 backdrop-blur-xl flex items-center justify-between gap-2.5">
          {/* User Profile Info (Avatar, Name, Email) */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1.5px] shadow-[0_0_12px_rgba(6,182,212,0.35)] shrink-0">
              <div className="w-full h-full rounded-full bg-[#070d1e] flex items-center justify-center font-mono font-bold text-xs text-cyan-300">
                SA
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs text-slate-100 truncate tracking-wide">
                {userName}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-mono">
                {userEmail}
              </p>
            </div>
          </div>

          {/* Right: Upgrade Button & Settings Gear Icon */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Upgrade Button */}
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-[11px] tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.35)] active:scale-95 transition-all"
            >
              <Sparkles className="w-3 h-3" />
              <span>Upgrade</span>
            </button>

            {/* Settings Gear Icon */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/50 transition-colors"
              title="Settings & Preferences"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#091124] border border-cyan-500/40 rounded-2xl p-5 shadow-[0_0_40px_rgba(6,182,212,0.25)] text-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-mono font-bold text-cyan-200 text-sm tracking-wide">
                  HARVEY Neural Core Pro
                </h3>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <p className="text-slate-300">
                Unlock higher context windows, unlimited extended reasoning (<strong>Think Harder</strong>), prioritized sub-second response times, and full audio/vision streaming capabilities.
              </p>

              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                  <Check className="w-3.5 h-3.5 text-cyan-400" /> Unlimited Think Harder Extended Reasoning
                </div>
                <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                  <Check className="w-3.5 h-3.5 text-cyan-400" /> Real-time Live Video Feed Inspection
                </div>
                <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                  <Check className="w-3.5 h-3.5 text-cyan-400" /> Multi-Language Ultra Low Latency Engine
                </div>
                <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                  <Check className="w-3.5 h-3.5 text-cyan-400" /> AES-256 Encrypted Offline Vault
                </div>
              </div>

              <div className="text-center pt-2">
                <span className="text-xl font-bold font-mono text-cyan-300">$0 / mo</span>
                <span className="text-slate-400 text-[11px] ml-1.5">(AI Studio Dev Edition active)</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Harvey Pro capabilities are currently active in this AI Studio environment, Sir.');
                setShowUpgradeModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs tracking-wider uppercase hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              Activate Pro Features
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#091124] border border-cyan-500/40 rounded-2xl p-5 shadow-[0_0_40px_rgba(6,182,212,0.25)] text-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <h3 className="font-mono font-bold text-cyan-200 text-sm tracking-wide">
                  HARVEY Preferences & Settings
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070d1e] border border-cyan-500/20">
                <div>
                  <p className="font-semibold text-slate-200">Neural Persona Tone</p>
                  <p className="text-[10px] text-slate-400">JARVIS-inspired polite futuristic assistant</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  Polite & Precise
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070d1e] border border-cyan-500/20">
                <div>
                  <p className="font-semibold text-slate-200">Language Detection</p>
                  <p className="text-[10px] text-slate-400">Universal Dynamic (English, Hindi, Hinglish, Marathi, Global)</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  Auto Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070d1e] border border-cyan-500/20">
                <div>
                  <p className="font-semibold text-slate-200">Streaming Speed</p>
                  <p className="text-[10px] text-slate-400">Turbo low latency with instantaneous word render</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  Sub-second
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070d1e] border border-cyan-500/20">
                <div>
                  <p className="font-semibold text-slate-200">Security Architecture</p>
                  <p className="text-[10px] text-slate-400">AES-256 encrypted memory, scrypt hashing & rate limits</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400" /> Active
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Navigation Item Details Modal (for Library, Images, Scheduled, Students, Customise, Videos, Notebooks) */}
      {activeTabModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#091124] border border-cyan-500/40 rounded-2xl p-5 shadow-[0_0_40px_rgba(6,182,212,0.25)] text-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-mono font-bold text-cyan-200 text-sm tracking-wide">
                  {activeTabModal}
                </h3>
              </div>
              <button
                onClick={() => setActiveTabModal(null)}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 text-xs leading-relaxed space-y-3">
              {activeTabModal === 'Library' && (
                <div>
                  <p className="text-slate-300 mb-3">
                    Your personal repository of saved prompts, reference datasets, and knowledge snippets.
                  </p>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-[#070d1e] border border-cyan-500/20 flex items-center justify-between">
                      <span className="font-medium text-slate-200">Quantum Computing Fundamentals.pdf</span>
                      <span className="text-[10px] text-cyan-400 font-mono">1.2 MB</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#070d1e] border border-cyan-500/20 flex items-center justify-between">
                      <span className="font-medium text-slate-200">Neural Network Directives v2.json</span>
                      <span className="text-[10px] text-cyan-400 font-mono">340 KB</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#070d1e] border border-cyan-500/20 flex items-center justify-between">
                      <span className="font-medium text-slate-200">Hinglish & Hindi Language Corpus.txt</span>
                      <span className="text-[10px] text-cyan-400 font-mono">820 KB</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTabModal === 'Images' && (
                <div>
                  <p className="text-slate-300 mb-3">
                    Visual outputs, webcam snapshots, and attached images analyzed during your sessions with Harvey.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-3 rounded-xl bg-[#070d1e] border border-cyan-500/20">
                      <div className="h-20 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono text-[10px]">
                        Webcam Snap #1
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Today 10:14 AM</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#070d1e] border border-cyan-500/20">
                      <div className="h-20 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono text-[10px]">
                        Diagram Analysis #2
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Yesterday 4:32 PM</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTabModal === 'Scheduled' && (
                <div>
                  <p className="text-slate-300 mb-3">
                    Active tasks, scheduled briefings, and reminders handled by Harvey.
                  </p>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-[#070d1e] border border-cyan-500/20 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-200">Morning Intelligence Brief</p>
                        <p className="text-[10px] text-slate-400">Daily at 08:30 AM · Voice readout enabled</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        Active
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#070d1e] border border-cyan-500/20 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-200">Automated Memory Vault Backup</p>
                        <p className="text-[10px] text-slate-400">Nightly at 11:45 PM · AES-256 cipher</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        Scheduled
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTabModal === 'Students' && (
                <div>
                  <p className="text-slate-300 mb-3">
                    Student mode provides tailored learning plans, interactive concept flashcards, and exam preparation.
                  </p>
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1.5">
                    <p className="font-semibold text-cyan-300">Active Syllabus: Advanced Machine Learning & Systems</p>
                    <p className="text-[11px] text-slate-300">Harvey adapts complexity automatically based on your questions and checks understanding after technical explanations.</p>
                  </div>
                </div>
              )}

              {activeTabModal === 'Customise' && (
                <div>
                  <p className="text-slate-300 mb-3">
                    Tailor Harvey's interface themes, accent glows, and speech parameters.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070d1e] border border-cyan-500/20">
                      <span className="text-slate-200">HUD Theme</span>
                      <span className="text-[10px] font-mono text-cyan-300">Cyan Arc Reactor (Default)</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070d1e] border border-cyan-500/20">
                      <span className="text-slate-200">Typewriter Speed</span>
                      <span className="text-[10px] font-mono text-cyan-300">Instant Streaming</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070d1e] border border-cyan-500/20">
                      <span className="text-slate-200">Voice Synthesis Engine</span>
                      <span className="text-[10px] font-mono text-cyan-300">Native Global TTS</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTabModal === 'Videos' && (
                <div>
                  <p className="text-slate-300 mb-3">
                    Real-time video feed analysis, live camera streams, and video frame inspections.
                  </p>
                  <p className="text-[11px] text-cyan-300">
                    Use the <strong>Live</strong> button in the chat input bar to stream your camera directly to Harvey's vision engine with live audio feedback.
                  </p>
                </div>
              )}

              {activeTabModal.startsWith('Notebook:') && (
                <div>
                  <p className="text-slate-300 mb-2">
                    Dedicated workspace for notes, directives, and code blocks.
                  </p>
                  <div className="p-3 rounded-xl bg-[#070d1e] border border-cyan-500/20 font-mono text-[11px] text-slate-300 space-y-1">
                    <p className="text-cyan-400 font-bold"># Directives & System Context</p>
                    <p>- Security-first architecture active</p>
                    <p>- Universal dynamic global language detection enabled</p>
                    <p>- Sub-second streaming typewriter response</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTabModal(null)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
