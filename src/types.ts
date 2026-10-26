export interface EmailItem {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
  html?: string | null;
  text?: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TemporaryEmailsResponse {
  emails: EmailItem[];
  pagination: PaginationMeta;
}

export interface GeneratedInbox {
  address: string;
  handle: string;
  domain: string;
  createdAt: string;
  inboxUrl: string;
  instructions: string;
}

export interface ExtractedVerification {
  code: string | null;
  verificationUrls: string[];
  primaryUrl: string | null;
  subject: string;
  from: string;
  receivedAt: string;
  rawText: string;
  messageId: string;
}

export interface EmailValidatorResult {
  email: string;
  isValid: boolean;
  score: number;
  verdict: string;
  parts: {
    localPart: string;
    domain: string;
  };
  checks: {
    syntax: boolean;
    hasMxRecords: boolean;
    isDisposable: boolean;
    isRoleBased: boolean;
    isFreeWebmail: boolean;
    hasTypoDomain: boolean;
  };
  mxHosts: string[];
  reasons: string[];
}

export interface DisposableCheckerResult {
  input: string;
  domain: string;
  isDisposable: boolean;
  providerName?: string;
  riskScore: number;
  category: string;
  confidence: string;
  recommendation: string;
  verdict: string;
}

export interface SpamCheckerResult {
  deliverabilityScore: number;
  verdict: string;
  flagsCount: number;
  matches: Array<{
    category: string;
    phrase: string;
    count: number;
    weight: number;
  }>;
  metrics: {
    subjectLength: number;
    bodyLength: number;
    subjectCapsRatio: number;
    bodyCapsRatio: number;
    linkCount: number;
    hasShortenedLinks: boolean;
    hasUnsubscribeSignal: boolean;
    hasPhysicalAddressSignal: boolean;
    excessivePunctuationCount: number;
  };
  recommendations: string[];
}

export interface TrackerStripperResult {
  originalLength: number;
  cleanedLength: number;
  trackingPixelsCount: number;
  trackingLinksCount: number;
  totalTrackersCount: number;
  privacyScore: number;
  privacyGrade: string;
  cleanHtml: string;
  trackers: Array<{
    type: string;
    url: string;
    provider: string;
    category: string;
    risk: string;
    details: string;
  }>;
  securitySummary: string;
}

export interface DnsCheckerResult {
  domain: string;
  status: string;
  mx: {
    status: string;
    records: Array<{
      exchange: string;
      priority: number;
    }>;
  };
  spf?: {
    status: string;
    record?: string;
  };
  dmarc?: {
    status: string;
    record?: string;
  };
  dkim?: {
    status: string;
    selector?: string;
  };
  bimi?: {
    status: string;
  };
}
