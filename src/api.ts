import {
  TemporaryEmailsResponse,
  EmailItem,
  EmailValidatorResult,
  DisposableCheckerResult,
  SpamCheckerResult,
  TrackerStripperResult,
  DnsCheckerResult,
  ExtractedVerification,
} from './types';
import { extractVerificationCode, stripHtml } from './utils';

export class AliasMailClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl = process.env.ALIASMAIL_BACKEND_URL || 'https://backend.aliasmail.space') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultHeaders = {
      'User-Agent': 'AliasMail-MCP-Server/1.0 (+https://aliasmail.space)',
      'Origin': 'https://aliasmail.space',
      'Referer': 'https://aliasmail.space/',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  async getHealth(): Promise<{ status: string; timestamp?: string }> {
    const res = await fetch(`${this.baseUrl}/api/health`, {
      method: 'GET',
      headers: this.defaultHeaders,
    });
    if (!res.ok) {
      throw new Error(`Health check failed with HTTP ${res.status}`);
    }
    return (await res.json()) as { status: string; timestamp?: string };
  }

  async getTemporaryEmails(
    address: string,
    page = 1,
    limit = 15
  ): Promise<TemporaryEmailsResponse> {
    const cleanAddress = address.trim().toLowerCase();
    const url = `${this.baseUrl}/api/aliases/temporary/emails?address=${encodeURIComponent(
      cleanAddress
    )}&page=${page}&limit=${limit}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: this.defaultHeaders,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(
        `Failed to fetch messages for ${address} (HTTP ${res.status}): ${errText || res.statusText}`
      );
    }

    const data = await res.json();
    return {
      emails: Array.isArray(data.emails) ? data.emails : [],
      pagination: data.pagination || {
        page,
        limit,
        total: data.emails?.length || 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  async pollForEmail(
    address: string,
    options: {
      timeoutSeconds?: number;
      pollIntervalSeconds?: number;
      subjectFilter?: string;
      fromFilter?: string;
    } = {}
  ): Promise<EmailItem | null> {
    const timeoutSeconds = Math.min(Math.max(options.timeoutSeconds || 60, 5), 180);
    const pollInterval = Math.max(options.pollIntervalSeconds || 3, 2) * 1000;
    const deadline = Date.now() + timeoutSeconds * 1000;

    const subjectFilter = options.subjectFilter?.toLowerCase();
    const fromFilter = options.fromFilter?.toLowerCase();

    while (Date.now() < deadline) {
      try {
        const response = await this.getTemporaryEmails(address, 1, 15);
        if (response.emails && response.emails.length > 0) {
          const matched = response.emails.find((email) => {
            if (subjectFilter && !email.subject?.toLowerCase().includes(subjectFilter)) {
              return false;
            }
            if (fromFilter && !email.from?.toLowerCase().includes(fromFilter)) {
              return false;
            }
            return true;
          });

          if (matched) {
            return matched;
          }
        }
      } catch (err) {
        // Transient error during poll, continue waiting until deadline
      }

      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await new Promise((resolve) => setTimeout(resolve, Math.min(pollInterval, remaining)));
    }

    return null;
  }

  async pollForVerificationCode(
    address: string,
    options: {
      timeoutSeconds?: number;
      pollIntervalSeconds?: number;
      subjectFilter?: string;
    } = {}
  ): Promise<ExtractedVerification | null> {
    const email = await this.pollForEmail(address, {
      timeoutSeconds: options.timeoutSeconds || 60,
      pollIntervalSeconds: options.pollIntervalSeconds || 3,
      subjectFilter: options.subjectFilter,
    });

    if (!email) {
      return null;
    }

    const verification = extractVerificationCode(
      email.subject || '',
      email.text || '',
      email.html || ''
    );

    return {
      code: verification.code,
      verificationUrls: verification.verificationUrls,
      primaryUrl: verification.primaryUrl,
      subject: email.subject,
      from: email.from,
      receivedAt: email.receivedAt,
      rawText: email.text || stripHtml(email.html || ''),
      messageId: email.id,
    };
  }

  async validateEmail(email: string): Promise<EmailValidatorResult> {
    const res = await fetch(`${this.baseUrl}/api/tools/email-validator`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Email validation error (HTTP ${res.status}): ${err}`);
    }

    const json = (await res.json()) as { status: string; data: EmailValidatorResult };
    return json.data;
  }

  async checkDisposable(target: string): Promise<DisposableCheckerResult> {
    const payload = target.includes('@') ? { email: target } : { domain: target };
    const res = await fetch(`${this.baseUrl}/api/tools/disposable-checker`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Disposable check error (HTTP ${res.status}): ${err}`);
    }

    const json = (await res.json()) as { status: string; data: DisposableCheckerResult };
    return json.data;
  }

  async checkSpamScore(subject?: string, body?: string): Promise<SpamCheckerResult> {
    const res = await fetch(`${this.baseUrl}/api/tools/spam-checker`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify({ subject, body }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Spam check error (HTTP ${res.status}): ${err}`);
    }

    const json = (await res.json()) as { status: string; data: SpamCheckerResult };
    return json.data;
  }

  async analyzeHeaders(headers: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/tools/header-analyzer`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify({ headers }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Header analysis error (HTTP ${res.status}): ${err}`);
    }

    const json = await res.json();
    return json.data;
  }

  async cleanTracking(html: string): Promise<TrackerStripperResult> {
    const res = await fetch(`${this.baseUrl}/api/tools/email-tracker-stripper`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify({ html }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Tracking stripper error (HTTP ${res.status}): ${err}`);
    }

    const json = (await res.json()) as { status: string; data: TrackerStripperResult };
    return json.data;
  }

  async checkDns(domain: string): Promise<DnsCheckerResult> {
    const res = await fetch(`${this.baseUrl}/api/tools/dns-checker`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify({ domain }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`DNS check error (HTTP ${res.status}): ${err}`);
    }

    const json = (await res.json()) as { status: string; data: DnsCheckerResult };
    return json.data;
  }
}

export const aliasMailClient = new AliasMailClient();
