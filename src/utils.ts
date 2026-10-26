export const ADJECTIVES = [
  'swift',
  'dark',
  'neon',
  'ghost',
  'lunar',
  'cyber',
  'void',
  'shadow',
  'frost',
  'solar',
  'quantum',
  'hyper',
  'apex',
  'silent',
  'covert',
  'vector',
  'prism',
  'zenith',
] as const;

export const NOUNS = [
  'fox',
  'byte',
  'drop',
  'void',
  'node',
  'spark',
  'pulse',
  'flare',
  'echo',
  'drift',
  'shield',
  'matrix',
  'falcon',
  'orbit',
  'vault',
  'signal',
  'nexus',
  'beacon',
] as const;

export const DEFAULT_DOMAIN = 'aliasmail.space';

export function generateRandomHandle(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}${noun}${num}`;
}

export function sanitizeHandle(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[._-]+|[._-]+$/g, '');
}

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s+\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function extractUrls(content: string): string[] {
  if (!content) return [];
  const urlRegex = /https?:\/\/[^\s"'<>]+/gi;
  const matches = content.match(urlRegex) || [];
  const cleanUrls = matches
    .map((u) => u.replace(/[.,;!?)\]]+$/, ''))
    .filter((u) => {
      try {
        new URL(u);
        return true;
      } catch {
        return false;
      }
    });
  return Array.from(new Set(cleanUrls));
}

export function extractVerificationCode(
  subject: string = '',
  text: string = '',
  html: string = ''
): {
  code: string | null;
  verificationUrls: string[];
  primaryUrl: string | null;
} {
  const combined = `${subject}\n${text}\n${stripHtml(html)}`;

  // 1. Look for explicit keyword patterns like "verification code: 123456", "OTP is 987654", etc.
  const keywordPatterns = [
    /(?:verification|confirmation|security|auth|one-time|login|access)\s*(?:code|passcode|pin|token|is|:)\s*[:#-]?\s*([a-z0-9]{4,8})\b/i,
    /(?:code|otp)\s*(?:is|:)\s*[:#-]?\s*([0-9]{4,8})\b/i,
    /\b([0-9]{3}[-\s][0-9]{3})\b/, // 123-456 or 123 456
    /\b([0-9]{6})\b/, // 6-digit standalone code
    /\b([0-9]{4})\b/, // 4-digit code
    /\b([0-9]{8})\b/, // 8-digit code
  ];

  let detectedCode: string | null = null;
  for (const pattern of keywordPatterns) {
    const match = combined.match(pattern);
    if (match && match[1]) {
      detectedCode = match[1].replace(/[-\s]/g, '');
      break;
    }
  }

  // 2. Extract verification / activation URLs
  const allUrls = extractUrls(`${text}\n${html}`);
  const verifyKeywords = ['verify', 'confirm', 'activate', 'token', 'auth', 'magic', 'signup', 'login'];
  
  const verificationUrls = allUrls.filter((url) => {
    const lower = url.toLowerCase();
    return verifyKeywords.some((kw) => lower.includes(kw));
  });

  const primaryUrl = verificationUrls.length > 0 ? verificationUrls[0] : null;

  return {
    code: detectedCode,
    verificationUrls,
    primaryUrl,
  };
}
