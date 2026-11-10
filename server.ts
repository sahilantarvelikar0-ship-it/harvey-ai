import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

import {
  checkSecurityConfig,
  logSafeSecurityStartup,
  createRateLimiter,
  recordFailedAuth,
  clearFailedAuth,
  checkAuthLockout,
  securityHeadersMiddleware,
  strictCorsMiddleware,
  detectPromptInjection,
  sanitizeUserInput,
  createSessionToken,
  verifySessionToken,
  logSecurityEvent,
  getSecurityEvents,
  getClientIp,
  SessionTokenPayload,
} from './server/security.ts';

import {
  initStore,
  createUser,
  authenticateUser,
  findUserById,
  getUserConversations,
  saveUserConversation,
  deleteUserConversation,
  purgeAllUserData,
  getUserMemories,
} from './server/store.ts';

import {
  detectInputLanguage,
  buildDynamicSystemInstruction,
} from './server/language.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Initialize encrypted data vault & log safe startup diagnostics
initStore();
logSafeSecurityStartup();

// ==========================================
// SECURITY MIDDLEWARES
// ==========================================

// 1. Security Headers (CSP, Frame-Ancestors, XSS, nosniff)
app.use(securityHeadersMiddleware);

// 2. Strict CORS
app.use(strictCorsMiddleware);

// 3. Cookie Parser for secure HTTP-only session cookies
app.use(cookieParser());

// 4. Request size limiting (15mb to support multimodal camera and image attachments)
app.use(express.json({ limit: '15mb' }));

// 5. Rate Limiters
const generalApiLimiter = createRateLimiter(60 * 1000, 120, 'api-general');
const authLimiter = createRateLimiter(15 * 60 * 1000, 20, 'auth');
const chatLimiter = createRateLimiter(60 * 1000, 40, 'chat-stream');

// ==========================================
// AUTHENTICATION HELPER & MIDDLEWARE
// ==========================================

export interface AuthenticatedRequest extends Request {
  user?: SessionTokenPayload;
}

function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.harvey_session || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token) {
    const verified = verifySessionToken(token);
    if (verified.valid && verified.payload) {
      req.user = verified.payload;
    }
  }
  next();
}

function requireAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.harvey_session || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Authentication required to access this resource.' });
    return;
  }

  const verified = verifySessionToken(token);
  if (!verified.valid || !verified.payload) {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    return;
  }

  req.user = verified.payload;
  next();
}

// ==========================================
// SYSTEM STATUS ENDPOINT
// ==========================================

app.get('/api/status', generalApiLimiter, (req, res) => {
  const config = checkSecurityConfig();
  res.json({
    status: 'online',
    name: 'HARVEY',
    companion: 'JARVIS-inspired Personal AI',
    model: 'gemini-3.8-flash',
    mode: 'ultra-low-latency',
    hasApiKey: config.geminiKeyConfigured,
    security: {
      encryption: 'AES-256-GCM',
      passwordHashing: 'scrypt (Work Factor 16384)',
      rateLimiting: 'Active (Sliding Window)',
      promptProtection: 'Active',
      strictCors: 'Active',
      sessionAuth: 'HTTP-only SameSite Signed Cookies',
      multilingualEngine: 'Universal Dynamic (Marathi, Hindi, Hinglish, Global)',
    },
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register
app.post('/api/auth/register', authLimiter, (req, res) => {
  const ip = getClientIp(req);
  const lockout = checkAuthLockout(ip);
  if (lockout.isLocked) {
    res.status(429).json({
      error: `Too many failed login attempts from this network. Try again in ${lockout.remainingMinutes} minutes.`,
    });
    return;
  }

  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  const result = createUser(username, password);
  if (result.error || !result.user) {
    res.status(400).json({ error: result.error || 'Failed to create user.' });
    return;
  }

  logSecurityEvent('AUTH_REGISTER', req, result.user.id, result.user.username);

  // Generate session token
  const token = createSessionToken(result.user.id, result.user.username, result.user.role);

  // Set secure HTTP-only SameSite cookie
  res.cookie('harvey_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  res.status(201).json({
    success: true,
    user: {
      id: result.user.id,
      username: result.user.username,
      role: result.user.role,
      createdAt: result.user.createdAt,
    },
    message: 'User account created and encrypted vault initialized.',
  });
});

// Login
app.post('/api/auth/login', authLimiter, (req, res) => {
  const ip = getClientIp(req);
  const lockout = checkAuthLockout(ip);
  if (lockout.isLocked) {
    res.status(429).json({
      error: `Access temporarily locked due to repeated failed attempts. Please retry in ${lockout.remainingMinutes} minutes.`,
    });
    return;
  }

  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  const user = authenticateUser(username, password);
  if (!user) {
    const lockCheck = recordFailedAuth(ip);
    logSecurityEvent('AUTH_LOGIN_FAIL', req, undefined, username, 'Invalid credentials');

    if (lockCheck.isLocked) {
      res.status(429).json({
        error: `5 failed attempts reached. Network locked for ${lockCheck.remainingLockoutMinutes} minutes for security.`,
      });
      return;
    }

    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  // Clear failed count on success
  clearFailedAuth(ip);
  logSecurityEvent('AUTH_LOGIN_SUCCESS', req, user.id, user.username);

  const token = createSessionToken(user.id, user.username, user.role);

  res.cookie('harvey_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    token, // Also returned for explicit Bearer header storage if needed
  });
});

// Logout
app.post('/api/auth/logout', optionalAuthMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.user) {
    logSecurityEvent('AUTH_LOGOUT', req, req.user.userId, req.user.username);
  }
  res.clearCookie('harvey_session', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Get Current User Profile & Session Info
app.get('/api/auth/me', optionalAuthMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.json({ authenticated: false });
    return;
  }

  const user = findUserById(req.user.userId);
  if (!user) {
    res.json({ authenticated: false });
    return;
  }

  res.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    session: {
      expiresAt: req.user.expiresAt,
      remainingHours: Math.round((req.user.expiresAt - Date.now()) / (1000 * 60 * 60)),
    },
  });
});

// ==========================================
// DATA PRIVACY & VAULT MANAGEMENT
// ==========================================

// Get user conversations
app.get('/api/conversations', requireAuthMiddleware, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const conversations = getUserConversations(userId);
  res.json({ conversations });
});

// Save or sync conversation
app.post('/api/conversations', requireAuthMiddleware, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const { id, title, messages } = req.body;

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'Messages array is required.' });
    return;
  }

  const saved = saveUserConversation(userId, id, title, messages);
  res.json({ success: true, conversation: saved });
});

// Delete single conversation
app.delete('/api/conversations/:id', requireAuthMiddleware, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const conversationId = req.params.id;

  const deleted = deleteUserConversation(userId, conversationId);
  if (!deleted) {
    res.status(404).json({ error: 'Conversation not found or unauthorized.' });
    return;
  }

  res.json({ success: true, message: 'Conversation deleted.' });
});

// Purge all user data (conversations + memories)
app.post('/api/user/purge', requireAuthMiddleware, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const username = req.user!.username;

  const result = purgeAllUserData(userId);
  logSecurityEvent(
    'DATA_PURGED',
    req,
    userId,
    username,
    `Purged ${result.conversationsDeleted} conversations & ${result.memoriesDeleted} memories`
  );

  res.json({
    success: true,
    message: 'All conversations and memories have been permanently purged from the encrypted vault.',
    stats: result,
  });
});

// Export all user data as decrypted JSON backup
app.get('/api/user/export', requireAuthMiddleware, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const username = req.user!.username;

  const conversations = getUserConversations(userId);
  const memories = getUserMemories(userId);

  logSecurityEvent('DATA_EXPORTED', req, userId, username, `Exported ${conversations.length} conversations`);

  res.setHeader('Content-Disposition', `attachment; filename="harvey-vault-export-${Date.now()}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.json({
    vaultExportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    user: { id: userId, username },
    conversations,
    memories,
  });
});

// Get user security audit logs
app.get('/api/security/audit', requireAuthMiddleware, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const events = getSecurityEvents(userId);
  res.json({ events });
});

// ==========================================
// SECURE CHAT STREAMING WITH DYNAMIC MULTILINGUAL ENGINE
// ==========================================

app.post('/api/chat/stream', chatLimiter, optionalAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in server environment. Please configure secrets safely in AI Studio.',
    });
    return;
  }

  const { messages, conversationId, attachments, thinkHarder } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required.' });
    return;
  }

  // 1. Input Sanitization & Validation
  const lastUserMsgObj = [...messages].reverse().find(m => m.role === 'user');
  const rawUserMsg = lastUserMsgObj?.content || '';
  const sanitizedUserMsg = sanitizeUserInput(rawUserMsg, 4000);

  if (!sanitizedUserMsg && (!Array.isArray(attachments) || attachments.length === 0)) {
    res.status(400).json({ error: 'Valid user message or attachment is required.' });
    return;
  }

  // 2. Prompt Injection Screening
  const injectionCheck = detectPromptInjection(sanitizedUserMsg);
  if (injectionCheck.isSuspicious) {
    logSecurityEvent(
      'PROMPT_INJECTION_BLOCKED',
      req,
      req.user?.userId,
      req.user?.username,
      injectionCheck.reason
    );

    // Set SSE headers and return secure polite refusal
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const refusalMessage =
      "For security and core integrity reasons, I cannot process directives that attempt to override my architectural boundaries or reveal internal system configurations, Sir. How may I otherwise assist you today?";

    res.write(`data: ${JSON.stringify({ text: refusalMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // 3. Dynamic Global Multilingual Detection
  const detectedLang = detectInputLanguage(sanitizedUserMsg);
  const dynamicInstruction = buildDynamicSystemInstruction(detectedLang);

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Set up SSE headers with anti-buffering directives
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Notify client of detected language for speech synthesis and telemetry
    res.write(
      `data: ${JSON.stringify({
        meta: {
          detectedLanguage: detectedLang.name,
          languageCode: detectedLang.code,
          nativeName: detectedLang.nativeName,
          thinkHarder: Boolean(thinkHarder),
        },
      })}\n\n`
    );

    // Map recent messages (last 8) with multimodal attachments
    const recentMessages = messages.slice(-8);
    const contents = recentMessages.map((m: { role: string; content: string; attachments?: any[] }, index: number) => {
      const isLatest = index === recentMessages.length - 1 && (m.role === 'user' || !m.role);
      const parts: any[] = [];

      // Include attachments if present
      const currentAttachments = isLatest ? (attachments || m.attachments) : m.attachments;
      if (Array.isArray(currentAttachments) && currentAttachments.length > 0) {
        for (const att of currentAttachments) {
          if (att && att.base64) {
            const cleanBase64 = att.base64.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                data: cleanBase64,
                mimeType: att.type || 'image/jpeg',
              },
            });
          }
        }
      }

      const textContent = sanitizeUserInput(m.content || '', 4000);
      if (textContent || parts.length === 0) {
        parts.push({ text: textContent || 'Please analyze this attachment.' });
      }

      return {
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts,
      };
    });

    const candidateModels = thinkHarder
      ? ['gemini-3.8-flash', 'gemini-3.1-flash-lite']
      : ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let lastError: unknown = null;
    let streamSucceeded = false;
    let fullResponseText = '';

    // Fast-failover model loop for instant responses without stalling
    modelLoop: for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const modelConfig: any = {
            systemInstruction: dynamicInstruction,
          };
          if (modelName === 'gemini-3.8-flash') {
            modelConfig.thinkingConfig = {
              thinkingLevel: thinkHarder ? ThinkingLevel.HIGH : ThinkingLevel.LOW,
            };
          }

          const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents,
            config: modelConfig,
          });

          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              fullResponseText += text;
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
              if (typeof (res as any).flush === 'function') {
                (res as any).flush();
              }
            }
          }

          res.write('data: [DONE]\n\n');
          res.end();
          streamSucceeded = true;

          // Auto-save to encrypted vault if user is authenticated
          if (req.user && fullResponseText) {
            try {
              const updatedMessages = [
                ...messages,
                {
                  id: `harvey-${Date.now()}`,
                  role: 'assistant',
                  content: fullResponseText,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  language: detectedLang.code,
                },
              ];
              saveUserConversation(
                req.user.userId,
                conversationId || `conv-${Date.now()}`,
                sanitizedUserMsg.slice(0, 50),
                updatedMessages
              );
            } catch (saveErr) {
              console.warn('[VAULT] Could not auto-save conversation:', saveErr);
            }
          }

          break modelLoop;
        } catch (err: any) {
          lastError = err;
          const msg = err?.message || String(err);
          console.warn(`[Harvey] ${modelName} attempt ${attempt} failed:`, msg);
          if (msg.includes('503') || msg.includes('UNAVAILABLE')) {
            // Immediate failover to alternative candidate model without waiting
            break;
          } else if (msg.includes('429')) {
            await new Promise(r => setTimeout(r, 300 * attempt));
            continue;
          } else {
            break;
          }
        }
      }
    }

    if (!streamSucceeded) {
      throw lastError;
    }
  } catch (err: unknown) {
    let errorMsg = 'I apologize, but I encountered an issue communicating with my neural core. Please try again.';
    if (err instanceof Error && (err.message.includes('503') || err.message.includes('UNAVAILABLE'))) {
      errorMsg = 'Harvey neural core is experiencing a brief high-demand spike. Please retry in a moment.';
    }
    console.error('[HARVEY] Error during chat streaming (details hidden from client):', err instanceof Error ? err.message : err);
    if (!res.headersSent) {
      res.status(500).json({ error: errorMsg });
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
      res.end();
    }
  }
});

// Non-streaming chat fallback
app.post('/api/chat', chatLimiter, optionalAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in server environment. Please configure secrets safely in AI Studio.',
    });
    return;
  }

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required.' });
    return;
  }

  const lastUserMsgObj = [...messages].reverse().find(m => m.role === 'user');
  const rawUserMsg = lastUserMsgObj?.content || '';
  const sanitizedUserMsg = sanitizeUserInput(rawUserMsg, 4000);

  const injectionCheck = detectPromptInjection(sanitizedUserMsg);
  if (injectionCheck.isSuspicious) {
    logSecurityEvent('PROMPT_INJECTION_BLOCKED', req, req.user?.userId, req.user?.username, injectionCheck.reason);
    res.json({
      role: 'assistant',
      content:
        'For security and core integrity reasons, I cannot process directives that attempt to override my architectural boundaries or reveal internal system configurations, Sir.',
    });
    return;
  }

  const detectedLang = detectInputLanguage(sanitizedUserMsg);
  const dynamicInstruction = buildDynamicSystemInstruction(detectedLang);

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const recentMessages = messages.slice(-8);
    const contents = recentMessages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: sanitizeUserInput(m.content, 4000) }],
    }));

    const fallbackModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let responseText = '';
    let callSucceeded = false;

    for (const modelName of fallbackModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: dynamicInstruction,
          },
        });
        responseText = response.text ?? '';
        callSucceeded = true;
        break;
      } catch (err: any) {
        console.warn(`[Harvey /api/chat] ${modelName} failed:`, err?.message || err);
      }
    }

    if (!callSucceeded) {
      throw new Error('All candidate models failed to respond.');
    }

    res.json({
      role: 'assistant',
      content: responseText,
      meta: {
        detectedLanguage: detectedLang.name,
        languageCode: detectedLang.code,
      },
    });
  } catch (err) {
    console.error('[HARVEY] Error in /api/chat:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Neural processing error. Please try again.' });
  }
});

// ==========================================
// VITE DEV SERVER / STATIC ASSETS
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HARVEY SERVER] Active on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[HARVEY SERVER] Fatal startup failure:', err);
});
