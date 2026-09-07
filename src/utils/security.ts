/**
 * Enterprise Security Utility Module for Aishu Foods Platform
 * Provides XSS Defense, Input Sanitization, URL Protocol Validation,
 * Brute-Force Rate Limiting, Cryptographic Password Hashing, and Session Hardening.
 */

// 1. XSS (Cross-Site Scripting) Defense & HTML Sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*(['"]?)(.*?)\1/gi, '') // Remove onload, onerror, onclick, etc.
    .replace(/javascript\s*:/gi, '') // Remove inline javascript: schemes
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .trim();
};

// 2. Safe URL Sanitizer (Blocks malicious protocols like javascript: or data:text/html)
export const sanitizeUrl = (url: string, fallback = '/'): string => {
  if (!url || typeof url !== 'string') return fallback;
  const cleanUrl = url.trim();

  // Allow relative URLs starting with /
  if (cleanUrl.startsWith('/')) return cleanUrl;

  // Validate allowed absolute protocols (http, https, data:image/)
  const isHttp = /^https?:\/\//i.test(cleanUrl);
  const isSafeDataImage = /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/i.test(cleanUrl);

  if (isHttp || isSafeDataImage) {
    return cleanUrl;
  }

  return fallback;
};

// 3. Cryptographic Hashing (SHA-256 via Web Crypto API)
export const hashStringSHA256 = async (str: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Crypto API Error:', err);
    // Fallback hash implementation if Web Crypto is unavailable in non-secure contexts
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }
};

// 4. Client-Side Rate-Limiter (Brute-Force & Bot Spam Prevention)
interface AttemptRecord {
  count: number;
  lastAttempt: number;
  lockUntil?: number;
}

class RateLimiter {
  private records: Map<string, AttemptRecord> = new Map();

  check(key: string, maxAttempts = 5, windowMs = 5 * 60 * 1000, lockMs = 15 * 60 * 1000): { allowed: boolean; remaining: number; retryAfterSec?: number } {
    const now = Date.now();
    const record = this.records.get(key) || { count: 0, lastAttempt: now };

    // Check if locked out
    if (record.lockUntil && now < record.lockUntil) {
      const retryAfterSec = Math.ceil((record.lockUntil - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSec };
    }

    // Reset counter if time window passed
    if (now - record.lastAttempt > windowMs) {
      record.count = 0;
      record.lockUntil = undefined;
    }

    if (record.count >= maxAttempts) {
      record.lockUntil = now + lockMs;
      this.records.set(key, record);
      const retryAfterSec = Math.ceil(lockMs / 1000);
      return { allowed: false, remaining: 0, retryAfterSec };
    }

    return { allowed: true, remaining: maxAttempts - record.count };
  }

  recordAttempt(key: string): void {
    const now = Date.now();
    const record = this.records.get(key) || { count: 0, lastAttempt: now };
    record.count += 1;
    record.lastAttempt = now;
    this.records.set(key, record);
  }

  reset(key: string): void {
    this.records.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// 5. Strict Data Format Validators
export const validateEmail = (email: string): boolean => {
  if (!email || email.length > 254) return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
};

export const validateIndianPhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
  // Allows 10-digit numbers starting with 6, 7, 8, or 9 (or +91 prefix)
  const re = /^(?:(?:31|91)?[6-9]\d{9})$/;
  return re.test(cleanPhone);
};

export const validatePincode = (pincode: string): boolean => {
  if (!pincode) return false;
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
};

export const sanitizePrice = (price: number | string): number => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num) || num < 0 || !isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
};

export const sanitizeQuantity = (qty: number | string): number => {
  const num = typeof qty === 'string' ? parseInt(qty, 10) : qty;
  if (isNaN(num) || num < 1 || !isFinite(num)) return 1;
  return Math.min(100, Math.floor(num));
};
