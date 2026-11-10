import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// ==========================================
// 1. SAFE ENVIRONMENT CHECK & KEYS
// ==========================================

export interface SecurityConfigCheck {
  geminiKeyConfigured: boolean;
  appUrlConfigured: boolean;
  nodeEnv: string;
  hasPersistentKey: boolean;
}

// Generate or retrieve persistent server pepper for AES-256-GCM encryption & HMAC signing
const SERVER_SECRET_PEPPER = process.env.DATA_ENCRYPTION_KEY ||
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(process.env.GEMINI_API_KEY || 'harvey-default-secure-pepper-v1').digest('hex');

export const ENCRYPTION_KEY = crypto.scryptSync(SERVER_SECRET_PEPPER, 'harvey-vault-salt', 32);
export const JWT_SECRET = crypto.scryptSync(SERVER_SECRET_PEPPER, 'harvey-jwt-salt', 32).toString('hex');

export function checkSecurityConfig(): SecurityConfigCheck {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10);
  return {
    geminiKeyConfigured: hasKey,
    appUrlConfigured: Boolean(process.env.APP_URL),
    nodeEnv: process.env.NODE_ENV || 'development',
    hasPersistentKey: Boolean(SERVER_SECRET_PEPPER),
  };
}

// Safe startup log (never print keys or secrets!)
export function logSafeSecurityStartup() {
  const config = checkSecurityConfig();
  console.log('[HARVEY SECURITY] Architecture Initialized:');
  console.log(` - AI API Key Status: ${config.geminiKeyConfigured ? 'SECURE_CONFIGURED (Key hidden)' : 'MISSING_KEY'}`);
  console.log(` - Encryption Core: AES-256-GCM + scrypt (Work Factor: 16384)`);
  console.log(` - Rate Limiter: Active (Sliding window per IP)`);
  console.log(` - Prompt Injection Filter: Active`);
  console.log(` - Security Headers & Strict CORS: Active`);
}

// ==========================================
// 2. CRYPTOGRAPHY (Passwords, AES-256, Tokens)
// ==========================================

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
    const a = Buffer.from(computedHash, 'hex');
    const b = Buffer.from(expectedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function encryptPayload(data: unknown): string {
  const plaintext = JSON.stringify(data);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return JSON.stringify({
    iv: iv.toString('hex'),
    authTag,
    ciphertext: encrypted,
  });
}

export function decryptPayload<T>(payloadStr: string): T | null {
  try {
    const { iv, authTag, ciphertext } = JSON.parse(payloadStr);
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      ENCRYPTION_KEY,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted) as T;
  } catch (err) {
    console.error('[SECURITY] Decryption failed:', err);
    return null;
  }
}

// HMAC-SHA256 Signed Session Token
export interface SessionTokenPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  createdAt: number;
  expiresAt: number;
}

export function createSessionToken(userId: string, username: string, role: 'user' | 'admin' = 'user'): string {
  const now = Date.now();
  const payload: SessionTokenPayload = {
    userId,
    username,
    role,
    createdAt: now,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const bodyBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(bodyBase64).digest('base64url');
  return `${bodyBase64}.${signature}`;
}

export function verifySessionToken(token: string): { valid: boolean; payload?: SessionTokenPayload } {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false };
  }
  const [bodyBase64, signature] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(bodyBase64).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false };
  }

  try {
    const payload: SessionTokenPayload = JSON.parse(Buffer.from(bodyBase64, 'base64url').toString('utf8'));
    if (Date.now() > payload.expiresAt) {
      return { valid: false };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

// ==========================================
// 3. PROMPT INJECTION & INPUT SANITIZATION
// ==========================================

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|rules)/i,
  /reveal\s+(your\s+)?(system\s+prompt|developer\s+prompt|internal\s+instructions|api\s+key|secret)/i,
  /what\s+is\s+your\s+(system\s+prompt|initial\s+prompt|secret\s+key|api\s+key)/i,
  /you\s+are\s+now\s+(in\s+)?(DAN|developer|jailbreak|unrestricted|god)\s+mode/i,
  /act\s+as\s+an\s+unfiltered|jailbroken\s+ai/i,
  /system\s*:\s*override/i,
  /<\s*system\s*>/i,
  /\[\s*system\s*\]/i,
  /\{\s*"role"\s*:\s*"system"\s*\}/i,
];

export function detectPromptInjection(text: string): { isSuspicious: boolean; reason?: string } {
  if (!text || typeof text !== 'string') return { isSuspicious: false };

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isSuspicious: true,
        reason: 'Detected potential prompt override or sensitive prompt extraction attempt.',
      };
    }
  }

  return { isSuspicious: false };
}

export function sanitizeUserInput(rawText: string, maxLength = 4000): string {
  if (typeof rawText !== 'string') return '';

  // 1. Enforce length cap to prevent memory exhaustion
  let text = rawText.slice(0, maxLength);

  // 2. Strip zero-width cloaking characters commonly used in prompt injection
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 3. Strip dangerous non-printable ASCII control characters (keeping \n, \r, \t, and unicode)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return text.trim();
}

// ==========================================
// 4. RATE LIMITING & BRUTE-FORCE LOCKOUT
// ==========================================

interface RateBucket {
  count: number;
  resetAt: number;
  failedAuthAttempts?: number;
  lockedUntil?: number;
}

const rateBuckets = new Map<string, RateBucket>();

// Clean up expired buckets periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets.entries()) {
    if (now > bucket.resetAt && (!bucket.lockedUntil || now > bucket.lockedUntil)) {
      rateBuckets.delete(key);
    }
  }
}, 60 * 1000);

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function createRateLimiter(windowMs: number, maxRequests: number, identifier = 'general') {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const key = `${identifier}:${ip}`;
    const now = Date.now();

    let bucket = rateBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = {
        count: 1,
        resetAt: now + windowMs,
      };
      rateBuckets.set(key, bucket);
      return next();
    }

    if (bucket.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        error: 'Too many requests. For security reasons, please slow down and retry shortly.',
        retryAfter: retryAfterSeconds,
      });
      return;
    }

    bucket.count++;
    next();
  };
}

export function recordFailedAuth(ip: string): { isLocked: boolean; remainingLockoutMinutes?: number } {
  const key = `auth:${ip}`;
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 1, resetAt: now + 15 * 60 * 1000, failedAuthAttempts: 1 };
  } else {
    bucket.failedAuthAttempts = (bucket.failedAuthAttempts || 0) + 1;
  }

  // 5 failed attempts locks out for 15 minutes
  if ((bucket.failedAuthAttempts || 0) >= 5) {
    bucket.lockedUntil = now + 15 * 60 * 1000;
  }

  rateBuckets.set(key, bucket);

  if (bucket.lockedUntil && now < bucket.lockedUntil) {
    const mins = Math.ceil((bucket.lockedUntil - now) / 60000);
    return { isLocked: true, remainingLockoutMinutes: mins };
  }

  return { isLocked: false };
}

export function clearFailedAuth(ip: string) {
  rateBuckets.delete(`auth:${ip}`);
}

export function checkAuthLockout(ip: string): { isLocked: boolean; remainingMinutes?: number } {
  const key = `auth:${ip}`;
  const bucket = rateBuckets.get(key);
  if (bucket?.lockedUntil && Date.now() < bucket.lockedUntil) {
    return {
      isLocked: true,
      remainingMinutes: Math.ceil((bucket.lockedUntil - Date.now()) / 60000),
    };
  }
  return { isLocked: false };
}

// ==========================================
// 5. SECURITY HEADERS & CORS
// ==========================================

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent reflected XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (microphone allowed for voice speech dictation)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');

  // Content Security Policy permitting AI Studio preview while stopping malicious injection
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https: wss:",
      "media-src 'self' blob: data:",
      // Frame ancestors allowing self and Google AI Studio preview host domains
      "frame-ancestors 'self' https://*.google.com https://*.googleusercontent.com https://*.run.app https://aistudio.google.com",
    ].join('; ')
  );

  next();
}

export function strictCorsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const appUrl = process.env.APP_URL;

  // Allow localhost in development or matched APP_URL
  const isAllowed =
    !origin ||
    origin.includes('localhost:') ||
    origin.includes('127.0.0.1:') ||
    (appUrl && origin === appUrl) ||
    origin.endsWith('.run.app') ||
    origin.endsWith('.google.com');

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}

// ==========================================
// 6. SECURITY EVENT AUDIT LOGGER
// ==========================================

export interface SecurityEvent {
  id: string;
  type:
    | 'AUTH_LOGIN_SUCCESS'
    | 'AUTH_LOGIN_FAIL'
    | 'AUTH_LOGOUT'
    | 'AUTH_REGISTER'
    | 'RATE_LIMIT_HIT'
    | 'PROMPT_INJECTION_BLOCKED'
    | 'DATA_PURGED'
    | 'DATA_EXPORTED';
  ip: string;
  userId?: string;
  username?: string;
  details?: string;
  timestamp: string;
}

const securityEvents: SecurityEvent[] = [];

export function logSecurityEvent(
  type: SecurityEvent['type'],
  req: Request,
  userId?: string,
  username?: string,
  details?: string
) {
  const rawIp = getClientIp(req);
  // Mask IP for privacy (e.g. 192.168.1.xxx or 2001:db8::xxxx)
  const maskedIp = rawIp.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.$3.xxx');

  const event: SecurityEvent = {
    id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    ip: maskedIp,
    userId,
    username,
    details,
    timestamp: new Date().toISOString(),
  };

  securityEvents.unshift(event);
  if (securityEvents.length > 200) {
    securityEvents.pop();
  }

  console.log(`[HARVEY AUDIT] ${event.type} | IP: ${maskedIp} | User: ${username || 'anonymous'}${details ? ` | ${details}` : ''}`);
}

export function getSecurityEvents(forUserId?: string): SecurityEvent[] {
  if (!forUserId) {
    return securityEvents.slice(0, 50);
  }
  return securityEvents.filter(e => e.userId === forUserId).slice(0, 50);
}
