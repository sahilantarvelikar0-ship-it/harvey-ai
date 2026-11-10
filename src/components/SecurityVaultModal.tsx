import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Key,
  Database,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  User,
  LogOut,
  X,
  RefreshCw,
  Clock,
  Layers,
  FileText,
  Activity,
  Globe,
} from 'lucide-react';
import { UserSession, StoredConversationSummary, SecurityAuditEvent } from '../types.ts';

interface SecurityVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  onAuthSuccess: (session: UserSession) => void;
  onLogout: () => void;
  onLoadConversation: (conv: StoredConversationSummary) => void;
}

export const SecurityVaultModal: React.FC<SecurityVaultModalProps> = ({
  isOpen,
  onClose,
  userSession,
  onAuthSuccess,
  onLogout,
  onLoadConversation,
}) => {
  const [activeTab, setActiveTab] = useState<'auth' | 'vault' | 'audit' | 'architecture'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vault data states
  const [conversations, setConversations] = useState<StoredConversationSummary[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [auditEvents, setAuditEvents] = useState<SecurityAuditEvent[]>([]);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState<string | null>(null);

  // Fetch conversations when tab changes to vault
  useEffect(() => {
    if (isOpen && userSession.authenticated) {
      if (activeTab === 'vault') {
        fetchConversations();
      } else if (activeTab === 'audit') {
        fetchAuditEvents();
      }
    }
  }, [isOpen, activeTab, userSession.authenticated]);

  const fetchConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchAuditEvents = async () => {
    try {
      const res = await fetch('/api/security/audit');
      if (res.ok) {
        const data = await res.json();
        setAuditEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to load audit events:', err);
    }
  };

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setAuthSuccess(
        authMode === 'login'
          ? 'Secure login verified. Vault session established.'
          : 'Account created with scrypt encryption. Vault initialized.'
      );
      setUsername('');
      setPassword('');

      // Refresh session
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      onAuthSuccess(meData);
      setActiveTab('vault');
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      onLogout();
      setActiveTab('auth');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation from the encrypted vault?')) {
      return;
    }

    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error('Delete conversation error:', err);
    }
  };

  const handlePurgeAllData = async () => {
    if (
      !window.confirm(
        'SECURITY WARNING: This will permanently delete ALL stored conversations and memories from the encrypted vault. This action CANNOT be undone.\n\nProceed with purge?'
      )
    ) {
      return;
    }

    setIsPurging(true);
    try {
      const res = await fetch('/api/user/purge', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setConversations([]);
        setPurgeSuccess('All user data permanently wiped from the encrypted server vault.');
      } else {
        alert(data.error || 'Failed to purge data');
      }
    } catch (err) {
      console.error('Purge error:', err);
    } finally {
      setIsPurging(false);
    }
  };

  const handleExportData = () => {
    window.location.href = '/api/user/export';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#070d1d] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-cyan-500/20 bg-[#081126]/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-mono tracking-wide text-slate-100">
                  HARVEY SECURITY VAULT
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AES-256-GCM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                End-to-end data privacy, secure authentication & AI guardrails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-cyan-500/15 bg-[#060b18] overflow-x-auto">
          <button
            onClick={() => setActiveTab('auth')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap min-h-[38px] ${
              activeTab === 'auth'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Authentication</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap min-h-[38px] ${
              activeTab === 'vault'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Encrypted Vault ({conversations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap min-h-[38px] ${
              activeTab === 'architecture'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>7 Security Layers</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap min-h-[38px] ${
              activeTab === 'audit'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: AUTHENTICATION */}
          {activeTab === 'auth' && (
            <div className="space-y-4">
              {userSession.authenticated && userSession.user ? (
                <div className="p-4 rounded-xl bg-[#09152e] border border-cyan-500/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold font-mono">
                        {userSession.user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          <span>{userSession.user.username}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                            {userSession.user.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Session valid for ~{userSession.session?.remainingHours || 168} hours</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleLogoutClick}
                      className="px-3.5 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/30 text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[44px]"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>

                  <div className="pt-3 border-t border-cyan-500/15 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Storage Protection:</span>
                      <span className="font-mono text-cyan-300">AES-256-GCM + scrypt salt</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cookie Security:</span>
                      <span className="font-mono text-cyan-300">HTTP-Only, SameSite=Lax, Signed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Created:</span>
                      <span className="text-slate-300">{new Date(userSession.user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-200">
                    <div className="font-semibold flex items-center gap-1.5 text-cyan-300">
                      <Lock className="w-4 h-4" />
                      <span>Private Encrypted Sessions</span>
                    </div>
                    <p className="text-slate-400 mt-1 leading-relaxed">
                      Log in or create a password-protected account to persist encrypted conversation history across devices with zero client-side credential exposure.
                    </p>
                  </div>

                  <div className="flex border-b border-cyan-500/20">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setAuthError(null); }}
                      className={`flex-1 py-2 text-xs font-medium border-b-2 text-center transition-all ${
                        authMode === 'login' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('register'); setAuthError(null); }}
                      className={`flex-1 py-2 text-xs font-medium border-b-2 text-center transition-all ${
                        authMode === 'register' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{authSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleAuthSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="e.g. tony_stark"
                        className="w-full px-3 py-2 rounded-xl bg-[#081226] border border-cyan-500/25 text-slate-100 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Password {authMode === 'register' && <span className="text-slate-400">(min 8 chars, uppercase, lowercase, number)</span>}
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 rounded-xl bg-[#081226] border border-cyan-500/25 text-slate-100 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs sm:text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all min-h-[44px] flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying Credentials...</span>
                        </>
                      ) : authMode === 'login' ? (
                        'Authenticate & Open Vault'
                      ) : (
                        'Create Protected Account'
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENCRYPTED VAULT & DATA PURGE */}
          {activeTab === 'vault' && (
            <div className="space-y-4">
              {!userSession.authenticated ? (
                <div className="p-6 text-center rounded-xl bg-[#09152e] border border-cyan-500/20 space-y-3">
                  <Lock className="w-8 h-8 text-cyan-400 mx-auto" />
                  <div className="text-sm font-semibold text-slate-200">Vault Locked</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Please log in via the Authentication tab to access and manage your encrypted conversation sessions and memories.
                  </p>
                  <button
                    onClick={() => setActiveTab('auth')}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-medium hover:bg-cyan-500/30 transition-all min-h-[44px]"
                  >
                    Go to Authentication
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {purgeSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{purgeSuccess}</span>
                    </div>
                  )}

                  {/* Vault Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#091328] border border-cyan-500/20 text-xs">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold text-slate-200">
                        {conversations.length} Stored Conversation{conversations.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportData}
                        className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900 flex items-center gap-1.5 transition-colors"
                        title="Download decrypted backup"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Backup</span>
                      </button>

                      <button
                        onClick={handlePurgeAllData}
                        disabled={isPurging || conversations.length === 0}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500/30 text-rose-300 hover:bg-rose-900 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Purge all user conversations"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Purge All Data</span>
                      </button>
                    </div>
                  </div>

                  {/* Conversation List */}
                  {isLoadingConversations ? (
                    <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Decrypting vault records...</span>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
                      No saved conversations found in vault. Chats will automatically save when you interact with Harvey while authenticated.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map(conv => (
                        <div
                          key={conv.id}
                          onClick={() => {
                            onLoadConversation(conv);
                            onClose();
                          }}
                          className="p-3 rounded-xl bg-[#0a152d] border border-cyan-500/15 hover:border-cyan-400/50 hover:bg-[#0c1a38] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-xs text-slate-200 group-hover:text-cyan-200 truncate">
                              {conv.title || 'Conversation Session'}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{conv.messages.length} messages</span>
                              <span>·</span>
                              <span>{new Date(conv.updatedAt).toLocaleDateString()} {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={e => handleDeleteConversation(conv.id, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                              title="Delete from vault"
                              aria-label="Delete conversation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 7 SECURITY LAYERS ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/25 text-cyan-200">
                <span className="font-bold text-cyan-300">Harvey Security-First Architecture</span>: Every requirement specified in the security constitution is strictly enforced.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#09152e] border border-cyan-500/20 space-y-1">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                    <Key className="w-4 h-4 text-cyan-400" />
                    <span>1. API Key Isolation</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Zero API keys in client-side code, bundles, storage, or logs. All AI calls proxy through server-side <code className="text-cyan-300">/api/chat/stream</code>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#09152e] border border-cyan-500/20 space-y-1">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    <span>2. scrypt + Timing-Safe Auth</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Work factor 16384, unique 16-byte random salts per user, and <code className="text-cyan-300">crypto.timingSafeEqual</code> to prevent side-channel timing attacks.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#09152e] border border-cyan-500/20 space-y-1">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>3. AES-256-GCM Vault</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Encrypted storage at rest with authenticated tags. Strict authorization checks ensure users can only access their own decrypted records.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#09152e] border border-cyan-500/20 space-y-1">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>4. Prompt Injection Defense</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Real-time regex & boundary heuristic filters screen out system extraction, DAN overrides, and delimiter hijacking before passing to Gemini.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#09152e] border border-cyan-500/20 space-y-1">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>5. Sliding-Window Rate Limiting</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Per-IP request limits with automatic 15-minute brute-force lockout after 5 consecutive failed authentication attempts.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#09152e] border border-cyan-500/20 space-y-1">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>6. Dynamic Global Multilingual</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Automatic dynamic detection for Marathi (मराठी), Hindi, Hinglish, Spanish, French, German, Japanese, and all world languages without manual toggles.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#081226] border border-slate-800 text-slate-400 text-[11px] leading-relaxed">
                <span className="font-semibold text-slate-300">Strict HTTP Security</span>: Enforces Content-Security-Policy, X-Content-Type-Options: nosniff, Referrer-Policy, frame-ancestors whitelist for AI Studio preview, and 256kb payload caps to eliminate buffer exhaustion DoS.
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Sanitized Security Events (Sensitive data redacted)</span>
                <button
                  onClick={fetchAuditEvents}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {auditEvents.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
                  No security events recorded yet in this session.
                </div>
              ) : (
                <div className="space-y-1.5 font-mono text-[11px]">
                  {auditEvents.map(evt => (
                    <div
                      key={evt.id}
                      className="p-2.5 rounded-lg bg-[#081126] border border-cyan-500/10 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              evt.type.includes('SUCCESS')
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                : evt.type.includes('FAIL') || evt.type.includes('BLOCKED')
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                                : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {evt.type}
                          </span>
                          <span className="text-slate-400">{evt.ip}</span>
                        </div>
                        {evt.details && <div className="text-slate-500 text-[10px] mt-1">{evt.details}</div>}
                      </div>
                      <span className="text-slate-500 text-[10px] shrink-0">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-cyan-500/20 bg-[#081126]/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Vault Status: Protected</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};
