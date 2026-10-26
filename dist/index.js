#!/usr/bin/env node

// src/index.ts
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// src/utils.ts
var ADJECTIVES = [
  "swift",
  "dark",
  "neon",
  "ghost",
  "lunar",
  "cyber",
  "void",
  "shadow",
  "frost",
  "solar",
  "quantum",
  "hyper",
  "apex",
  "silent",
  "covert",
  "vector",
  "prism",
  "zenith"
];
var NOUNS = [
  "fox",
  "byte",
  "drop",
  "void",
  "node",
  "spark",
  "pulse",
  "flare",
  "echo",
  "drift",
  "shield",
  "matrix",
  "falcon",
  "orbit",
  "vault",
  "signal",
  "nexus",
  "beacon"
];
var DEFAULT_DOMAIN = "aliasmail.space";
function generateRandomHandle() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}${noun}${num}`;
}
function sanitizeHandle(input) {
  return input.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").replace(/^[._-]+|[._-]+$/g, "");
}
function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<br\s*[\/]?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<\/div>/gi, "\n").replace(/<\/h[1-6]>/gi, "\n\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n\s+\n/g, "\n\n").replace(/[ \t]+/g, " ").trim();
}
function extractUrls(content) {
  if (!content) return [];
  const urlRegex = /https?:\/\/[^\s"'<>]+/gi;
  const matches = content.match(urlRegex) || [];
  const cleanUrls = matches.map((u) => u.replace(/[.,;!?)\]]+$/, "")).filter((u) => {
    try {
      new URL(u);
      return true;
    } catch {
      return false;
    }
  });
  return Array.from(new Set(cleanUrls));
}
function extractVerificationCode(subject = "", text = "", html = "") {
  const combined = `${subject}
${text}
${stripHtml(html)}`;
  const keywordPatterns = [
    /(?:verification|confirmation|security|auth|one-time|login|access)\s*(?:code|passcode|pin|token|is|:)\s*[:#-]?\s*([a-z0-9]{4,8})\b/i,
    /(?:code|otp)\s*(?:is|:)\s*[:#-]?\s*([0-9]{4,8})\b/i,
    /\b([0-9]{3}[-\s][0-9]{3})\b/,
    // 123-456 or 123 456
    /\b([0-9]{6})\b/,
    // 6-digit standalone code
    /\b([0-9]{4})\b/,
    // 4-digit code
    /\b([0-9]{8})\b/
    // 8-digit code
  ];
  let detectedCode = null;
  for (const pattern of keywordPatterns) {
    const match = combined.match(pattern);
    if (match && match[1]) {
      detectedCode = match[1].replace(/[-\s]/g, "");
      break;
    }
  }
  const allUrls = extractUrls(`${text}
${html}`);
  const verifyKeywords = ["verify", "confirm", "activate", "token", "auth", "magic", "signup", "login"];
  const verificationUrls = allUrls.filter((url) => {
    const lower = url.toLowerCase();
    return verifyKeywords.some((kw) => lower.includes(kw));
  });
  const primaryUrl = verificationUrls.length > 0 ? verificationUrls[0] : null;
  return {
    code: detectedCode,
    verificationUrls,
    primaryUrl
  };
}

// src/api.ts
var AliasMailClient = class {
  baseUrl;
  defaultHeaders;
  constructor(baseUrl = process.env.ALIASMAIL_BACKEND_URL || "https://backend.aliasmail.space") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.defaultHeaders = {
      "User-Agent": "AliasMail-MCP-Server/1.0 (+https://aliasmail.space)",
      "Origin": "https://aliasmail.space",
      "Referer": "https://aliasmail.space/",
      "Accept": "application/json",
      "Content-Type": "application/json"
    };
  }
  async getHealth() {
    const res = await fetch(`${this.baseUrl}/api/health`, {
      method: "GET",
      headers: this.defaultHeaders
    });
    if (!res.ok) {
      throw new Error(`Health check failed with HTTP ${res.status}`);
    }
    return await res.json();
  }
  async getTemporaryEmails(address, page = 1, limit = 15) {
    const cleanAddress = address.trim().toLowerCase();
    const url = `${this.baseUrl}/api/aliases/temporary/emails?address=${encodeURIComponent(
      cleanAddress
    )}&page=${page}&limit=${limit}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.defaultHeaders
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
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
        hasPrevPage: false
      }
    };
  }
  async pollForEmail(address, options = {}) {
    const timeoutSeconds = Math.min(Math.max(options.timeoutSeconds || 60, 5), 180);
    const pollInterval = Math.max(options.pollIntervalSeconds || 3, 2) * 1e3;
    const deadline = Date.now() + timeoutSeconds * 1e3;
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
      }
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await new Promise((resolve) => setTimeout(resolve, Math.min(pollInterval, remaining)));
    }
    return null;
  }
  async pollForVerificationCode(address, options = {}) {
    const email = await this.pollForEmail(address, {
      timeoutSeconds: options.timeoutSeconds || 60,
      pollIntervalSeconds: options.pollIntervalSeconds || 3,
      subjectFilter: options.subjectFilter
    });
    if (!email) {
      return null;
    }
    const verification = extractVerificationCode(
      email.subject || "",
      email.text || "",
      email.html || ""
    );
    return {
      code: verification.code,
      verificationUrls: verification.verificationUrls,
      primaryUrl: verification.primaryUrl,
      subject: email.subject,
      from: email.from,
      receivedAt: email.receivedAt,
      rawText: email.text || stripHtml(email.html || ""),
      messageId: email.id
    };
  }
  async validateEmail(email) {
    const res = await fetch(`${this.baseUrl}/api/tools/email-validator`, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Email validation error (HTTP ${res.status}): ${err}`);
    }
    const json = await res.json();
    return json.data;
  }
  async checkDisposable(target) {
    const payload = target.includes("@") ? { email: target } : { domain: target };
    const res = await fetch(`${this.baseUrl}/api/tools/disposable-checker`, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Disposable check error (HTTP ${res.status}): ${err}`);
    }
    const json = await res.json();
    return json.data;
  }
  async checkSpamScore(subject, body) {
    const res = await fetch(`${this.baseUrl}/api/tools/spam-checker`, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify({ subject, body })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Spam check error (HTTP ${res.status}): ${err}`);
    }
    const json = await res.json();
    return json.data;
  }
  async analyzeHeaders(headers) {
    const res = await fetch(`${this.baseUrl}/api/tools/header-analyzer`, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify({ headers })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Header analysis error (HTTP ${res.status}): ${err}`);
    }
    const json = await res.json();
    return json.data;
  }
  async cleanTracking(html) {
    const res = await fetch(`${this.baseUrl}/api/tools/email-tracker-stripper`, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify({ html })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Tracking stripper error (HTTP ${res.status}): ${err}`);
    }
    const json = await res.json();
    return json.data;
  }
  async checkDns(domain) {
    const res = await fetch(`${this.baseUrl}/api/tools/dns-checker`, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify({ domain })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`DNS check error (HTTP ${res.status}): ${err}`);
    }
    const json = await res.json();
    return json.data;
  }
};
var aliasMailClient = new AliasMailClient();

// src/index.ts
var server = new McpServer({
  name: "aliasmail-mcp",
  version: "1.0.0"
});
server.tool(
  "aliasmail_create_inbox",
  "Generate an instant, zero-log disposable temporary email inbox on AliasMail (https://aliasmail.space/). No registration required. Ready immediately to receive verification emails, OTP codes, or test messages.",
  {
    handle: z.string().optional().describe(
      'Optional custom handle/prefix for the email (e.g. "mybot", "qa-test-12"). If omitted, a random human-readable identity is generated.'
    )
  },
  async ({ handle }) => {
    try {
      const cleanHandle = handle ? sanitizeHandle(handle) : generateRandomHandle();
      const address = `${cleanHandle}@${DEFAULT_DOMAIN}`;
      const inboxUrl = `https://aliasmail.space/temporary/?address=${encodeURIComponent(address)}`;
      const output = [
        `###  AliasMail Disposable Inbox Created`,
        `- **Email Address**: \`${address}\``,
        `- **Web Live Inbox**: [Open on AliasMail.space](${inboxUrl})`,
        `- **Domain**: \`${DEFAULT_DOMAIN}\``,
        `- **Privacy**: Zero-log ephemeral inbox with automatic TTL expiration`,
        ``,
        `**Next Steps for Agent:**`,
        `1. Use \`${address}\` for signing up or testing on your target service.`,
        `2. Call \`aliasmail_wait_for_code\` to automatically extract the OTP code or confirmation link.`,
        `3. Or call \`aliasmail_get_messages\` to list all incoming emails for this address.`,
        ``,
        `*Powered by [AliasMail.space](https://aliasmail.space/) \u2014 Private Email Alias & Ephemeral Inboxes*`
      ].join("\n");
      return {
        content: [
          {
            type: "text",
            text: output
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to create inbox: ${err.message}` }]
      };
    }
  }
);
server.tool(
  "aliasmail_get_messages",
  "Fetch emails from an AliasMail temporary inbox (https://aliasmail.space/temporary/). Returns list of received messages with subject, sender, timestamp, and snippet.",
  {
    address: z.string().describe('The temporary email address to check (e.g. "user@aliasmail.space")'),
    page: z.number().int().min(1).default(1).describe("Page number for pagination (default: 1)"),
    limit: z.number().int().min(1).max(50).default(15).describe("Number of emails per page (default: 15)")
  },
  async ({ address, page, limit }) => {
    try {
      const response = await aliasMailClient.getTemporaryEmails(address, page, limit);
      if (response.emails.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No emails received yet for \`${address}\`.

*Check live web inbox at: https://aliasmail.space/temporary/?address=${encodeURIComponent(
                address
              )}*`
            }
          ]
        };
      }
      const formatted = response.emails.map((email, idx) => {
        const bodySnippet = stripHtml(email.text || email.html || "").slice(0, 140);
        return [
          `#### ${idx + 1}. ${email.subject || "(No Subject)"}`,
          `- **Message ID**: \`${email.id}\``,
          `- **From**: \`${email.from}\``,
          `- **Received**: ${email.receivedAt}`,
          `- **Snippet**: ${bodySnippet ? `"${bodySnippet}..."` : "(empty body)"}`
        ].join("\n");
      }).join("\n\n");
      const text = [
        `###  Inbox Messages for \`${address}\` (Total: ${response.pagination.total})`,
        formatted,
        ``,
        `*View in browser: [AliasMail Live Inbox](https://aliasmail.space/temporary/?address=${encodeURIComponent(
          address
        )})*`
      ].join("\n");
      return {
        content: [{ type: "text", text }]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to fetch messages: ${err.message}` }]
      };
    }
  }
);
server.tool(
  "aliasmail_get_message",
  "Retrieve full content of a specific email received in an AliasMail temporary inbox, including body text, sanitized HTML, headers, and extracted links/codes.",
  {
    address: z.string().describe("The email address associated with the inbox"),
    messageId: z.string().describe("The ID of the message to inspect")
  },
  async ({ address, messageId }) => {
    try {
      const response = await aliasMailClient.getTemporaryEmails(address, 1, 50);
      const email = response.emails.find((e) => e.id === messageId);
      if (!email) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Message with ID "${messageId}" was not found in inbox "${address}".`
            }
          ]
        };
      }
      const cleanText = email.text || stripHtml(email.html || "");
      const codeInfo = extractVerificationCode(email.subject || "", email.text || "", email.html || "");
      const lines = [
        `### \u2709\uFE0F Email Details: ${email.subject || "(No Subject)"}`,
        `- **Message ID**: \`${email.id}\``,
        `- **From**: \`${email.from}\``,
        `- **To**: \`${address}\``,
        `- **Date**: ${email.receivedAt}`,
        ``
      ];
      if (codeInfo.code) {
        lines.push(`>  **Detected Verification Code / OTP**: \`${codeInfo.code}\`
`);
      }
      if (codeInfo.primaryUrl) {
        lines.push(`>  **Primary Verification Link**: [${codeInfo.primaryUrl}](${codeInfo.primaryUrl})
`);
      }
      lines.push(`#### Body Content:`, `\`\`\``, cleanText || "(No plain text available)", `\`\`\``);
      return {
        content: [{ type: "text", text: lines.join("\n") }]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to retrieve message: ${err.message}` }]
      };
    }
  }
);
server.tool(
  "aliasmail_wait_for_code",
  "Autonomous AI Agent helper: Polls an AliasMail inbox until a verification/signup email arrives and automatically parses the 4-8 digit OTP code or confirmation link. Eliminates manual polling and regex parsing.",
  {
    address: z.string().describe('The temporary email address to monitor (e.g. "mybot123@aliasmail.space")'),
    timeoutSeconds: z.number().int().min(5).max(180).default(60).describe("Maximum wait time in seconds (default: 60s, max: 180s)"),
    pollIntervalSeconds: z.number().int().min(2).max(15).default(3).describe("Polling interval in seconds (default: 3s)"),
    subjectFilter: z.string().optional().describe('Optional keyword to filter subject (e.g. "verification", "confirm", "login", "code")')
  },
  async ({ address, timeoutSeconds, pollIntervalSeconds, subjectFilter }) => {
    try {
      const result = await aliasMailClient.pollForVerificationCode(address, {
        timeoutSeconds,
        pollIntervalSeconds,
        subjectFilter
      });
      if (!result) {
        return {
          content: [
            {
              type: "text",
              text: `\u23F0 Timeout reached (${timeoutSeconds}s) waiting for email to \`${address}\`.
No new message arrived matching criteria.

*Check live web inbox at: https://aliasmail.space/temporary/?address=${encodeURIComponent(
                address
              )}*`
            }
          ]
        };
      }
      const output = [
        `###  Verification Email Received for \`${address}\``,
        `- **Sender**: \`${result.from}\``,
        `- **Subject**: ${result.subject || "(No subject)"}`,
        `- **Received At**: ${result.receivedAt}`,
        ``,
        result.code ? `> ### \u{1F511} Verification Code (OTP): \`${result.code}\`` : `*No numerical code detected.*`,
        result.primaryUrl ? `> ### \u{1F517} Verification Link: [Click to Verify](${result.primaryUrl})
> URL: \`${result.primaryUrl}\`` : ``,
        ``,
        `#### Message Text Preview:`,
        `\`\`\``,
        result.rawText.slice(0, 400),
        `\`\`\``,
        ``,
        `*Zero-log temporary inboxes provided by [AliasMail.space](https://aliasmail.space/)*`
      ].filter(Boolean).join("\n");
      return {
        content: [{ type: "text", text: output }]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Polling failed: ${err.message}` }]
      };
    }
  }
);
server.tool(
  "aliasmail_wait_for_email",
  "Wait for any new incoming email on an AliasMail temporary inbox with optional sender or subject filtering.",
  {
    address: z.string().describe("The temporary email address to monitor"),
    timeoutSeconds: z.number().int().min(5).max(180).default(60).describe("Max wait time in seconds (default: 60s)"),
    pollIntervalSeconds: z.number().int().min(2).max(15).default(3).describe("Polling interval in seconds (default: 3s)"),
    subjectFilter: z.string().optional().describe("Keyword in subject"),
    fromFilter: z.string().optional().describe("Keyword in sender email or name")
  },
  async ({ address, timeoutSeconds, pollIntervalSeconds, subjectFilter, fromFilter }) => {
    try {
      const email = await aliasMailClient.pollForEmail(address, {
        timeoutSeconds,
        pollIntervalSeconds,
        subjectFilter,
        fromFilter
      });
      if (!email) {
        return {
          content: [
            {
              type: "text",
              text: `Timed out (${timeoutSeconds}s) waiting for email to \`${address}\`.`
            }
          ]
        };
      }
      const text = [
        `### \u2709\uFE0F Received Email on \`${address}\``,
        `- **ID**: \`${email.id}\``,
        `- **From**: \`${email.from}\``,
        `- **Subject**: ${email.subject}`,
        `- **Received At**: ${email.receivedAt}`,
        ``,
        `#### Body:`,
        `\`\`\``,
        email.text || stripHtml(email.html || ""),
        `\`\`\``
      ].join("\n");
      return {
        content: [{ type: "text", text }]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Failed waiting for email: ${err.message}` }]
      };
    }
  }
);
server.tool(
  "aliasmail_validate_email",
  "Deep email address validation via AliasMail (https://aliasmail.space/tools/email-validator/). Checks RFC 5322 syntax, domain MX resolution, typo detection (e.g. gmial.com), and disposable mailbox flagging.",
  {
    email: z.string().describe("The email address to validate")
  },
  async ({ email }) => {
    try {
      const res = await aliasMailClient.validateEmail(email);
      const text = [
        `### \u{1F6E1}\uFE0F Email Validation Report for \`${res.email}\``,
        `- **Verdict**: **${res.verdict}** (Score: ${res.score}/100)`,
        `- **Valid Syntax**: ${res.checks.syntax ? "\u2705 Valid" : "\u274C Invalid"}`,
        `- **Domain Has Active MX**: ${res.checks.hasMxRecords ? "\u2705 Yes" : "\u274C No"}`,
        `- **Disposable / Burner Domain**: ${res.checks.isDisposable ? "\u26A0\uFE0F Yes (Disposable)" : "\u2705 No"}`,
        `- **Role-Based Address (info@, admin@)**: ${res.checks.isRoleBased ? "\u26A0\uFE0F Yes" : "\u2705 No"}`,
        `- **Free Webmail (Gmail, Yahoo, etc.)**: ${res.checks.isFreeWebmail ? "\u2139\uFE0F Yes" : "\u{1F3E2} Corporate / Custom"}`,
        `- **Typo Detected in Domain**: ${res.checks.hasTypoDomain ? "\u26A0\uFE0F Potential Typo" : "\u2705 Clean"}`,
        ``,
        `**Mail Exchange (MX) Servers**:`,
        ...res.mxHosts && res.mxHosts.length > 0 ? res.mxHosts.map((h) => `- \`${h}\``) : ["- *(No MX records found)*"],
        ``,
        `*Free tool hosted at [AliasMail Email Validator](https://aliasmail.space/tools/email-validator/)*`
      ].join("\n");
      return { content: [{ type: "text", text }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Validation failed: ${err.message}` }]
      };
    }
  }
);
server.tool(
  "aliasmail_check_disposable",
  "Check whether an email address or domain belongs to a disposable/temporary burner provider or legitimate corporate mail infrastructure.",
  {
    target: z.string().describe('Email address or domain name (e.g. "10minutemail.com" or "user@tempmail.com")')
  },
  async ({ target }) => {
    try {
      const res = await aliasMailClient.checkDisposable(target);
      const text = [
        `### \u{1F50D} Disposable Domain Check: \`${res.domain}\``,
        `- **Verdict**: **${res.verdict}**`,
        `- **Is Disposable / Burner**: ${res.isDisposable ? "\u26A0\uFE0F YES" : "\u2705 NO"}`,
        `- **Risk Score**: ${res.riskScore}/100`,
        `- **Category**: ${res.category}`,
        `- **Confidence**: ${res.confidence}`,
        `- **Recommendation**: ${res.recommendation}`,
        ``,
        `*Powered by [AliasMail Fraud Prevention](https://aliasmail.space/tools/disposable-checker/)*`
      ].join("\n");
      return { content: [{ type: "text", text }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Disposable check failed: ${err.message}` }]
      };
    }
  }
);
server.tool(
  "aliasmail_check_spam_score",
  "Evaluate email copy against spam heuristic triggers, capitalization ratios, link density, and deliverability risk via AliasMail Spam Checker.",
  {
    subject: z.string().optional().describe("Email subject line"),
    body: z.string().optional().describe("Email body text")
  },
  async ({ subject, body }) => {
    try {
      const res = await aliasMailClient.checkSpamScore(subject, body);
      const text = [
        `### \u{1F4CA} Spam & Deliverability Score`,
        `- **Deliverability Score**: **${res.deliverabilityScore}/100**`,
        `- **Verdict**: **${res.verdict}**`,
        `- **Spam Trigger Flags**: ${res.flagsCount}`,
        ``,
        `#### Trigger Keywords Detected:`,
        ...res.matches.length > 0 ? res.matches.map((m) => `- "${m.phrase}" (${m.category}, weight: ${m.weight})`) : ["- *(None detected - clean copy)*"],
        ``,
        `#### Recommendations:`,
        ...res.recommendations.length > 0 ? res.recommendations.map((r) => `- ${r}`) : ["- Copy looks safe and ready for inbox delivery."],
        ``,
        `*Audit emails with [AliasMail Spam Checker](https://aliasmail.space/tools/spam-checker/)*`
      ].join("\n");
      return { content: [{ type: "text", text }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Spam check failed: ${err.message}` }]
      };
    }
  }
);
server.tool(
  "aliasmail_analyze_headers",
  "Deep RFC 822 email header analyzer: inspects SPF, DKIM, DMARC verdicts, hop relay transit timeline, and security grading.",
  {
    headers: z.string().describe("Raw RFC 822 email headers string")
  },
  async ({ headers }) => {
    try {
      const res = await aliasMailClient.analyzeHeaders(headers);
      return {
        content: [
          {
            type: "text",
            text: `### \u{1F52C} Header Analysis Results
\`\`\`json
${JSON.stringify(
              res,
              null,
              2
            )}
\`\`\`

*Inspect raw headers at [AliasMail Header Analyzer](https://aliasmail.space/tools/email-header-analyzer/)*`
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Header analysis failed: ${err.message}` }]
      };
    }
  }
);
server.tool(
  "aliasmail_clean_tracking",
  "Scan and defuse invisible 1x1 tracking pixels, read receipt beacons, and surveillance redirect links in email HTML.",
  {
    html: z.string().describe("The raw HTML of the email to sanitize")
  },
  async ({ html }) => {
    try {
      const res = await aliasMailClient.cleanTracking(html);
      const text = [
        `### \u{1F6E1}\uFE0F Tracking & Privacy Scrubbing Report`,
        `- **Privacy Score**: **${res.privacyScore}/100** (Grade: **${res.privacyGrade}**)`,
        `- **Spy Pixels Neutralized**: ${res.trackingPixelsCount}`,
        `- **Tracking Redirect Links**: ${res.trackingLinksCount}`,
        `- **Summary**: ${res.securitySummary}`,
        ``,
        `#### Defused Trackers:`,
        ...res.trackers.length > 0 ? res.trackers.map((t) => `- **${t.provider}** (${t.type}): \`${t.url}\` - *${t.details}*`) : ["- *(No surveillance pixels detected)*"],
        ``,
        `*Defuse email spy pixels with [AliasMail Tracker Stripper](https://aliasmail.space/tools/email-tracker-stripper/)*`
      ].join("\n");
      return { content: [{ type: "text", text }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Tracker cleaning failed: ${err.message}` }]
      };
    }
  }
);
server.tool(
  "aliasmail_check_dns",
  "Real-time DNS audit of domain Mail Exchange (MX) records, SPF syntax, DMARC policy enforcement, and DKIM public keys.",
  {
    domain: z.string().describe('The domain name to audit (e.g. "aliasmail.space" or "github.com")')
  },
  async ({ domain }) => {
    try {
      const res = await aliasMailClient.checkDns(domain);
      const text = [
        `### \u{1F310} DNS & Email Authentication Audit for \`${res.domain}\``,
        `- **MX Records Status**: ${res.mx?.status || "Unknown"} (${res.mx?.records?.length || 0} found)`,
        `- **SPF Record**: ${res.spf?.record ? `\`${res.spf.record}\`` : "None / Not configured"}`,
        `- **DMARC Record**: ${res.dmarc?.record ? `\`${res.dmarc.record}\`` : "None / Not configured"}`,
        `- **BIMI Brand Indicator**: ${res.bimi?.status || "Not configured"}`,
        ``,
        `*Run live DNS diagnostics on [AliasMail DNS Checker](https://aliasmail.space/tools/dns-checker/)*`
      ].join("\n");
      return { content: [{ type: "text", text }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `DNS audit failed: ${err.message}` }]
      };
    }
  }
);
server.tool(
  "aliasmail_health_check",
  "Check health and operational status of the AliasMail infrastructure and API services.",
  {},
  async () => {
    try {
      const health = await aliasMailClient.getHealth();
      return {
        content: [
          {
            type: "text",
            text: `\u2705 **AliasMail Services Online**
- Status: \`${health.status}\`
- Timestamp: ${health.timestamp || (/* @__PURE__ */ new Date()).toISOString()}
- Infrastructure: [AliasMail.space](https://aliasmail.space/)`
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `AliasMail health check failed: ${err.message}` }]
      };
    }
  }
);
server.resource(
  "temporary-inbox",
  new ResourceTemplate("aliasmail://inbox/{address}", { list: void 0 }),
  async (uri, { address }) => {
    const targetAddress = Array.isArray(address) ? address[0] : address;
    const response = await aliasMailClient.getTemporaryEmails(targetAddress, 1, 50);
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(response, null, 2)
        }
      ]
    };
  }
);
server.prompt(
  "signup-and-verify",
  {
    serviceName: z.string().describe("The name of the website/service to sign up for")
  },
  ({ serviceName }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `I need to create an account on ${serviceName}. Please generate an AliasMail temporary email address, use it to register, and wait for the verification code (OTP) or confirmation link using aliasmail_wait_for_code.`
        }
      }
    ]
  })
);
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main().catch((err) => {
  console.error("Fatal error starting AliasMail MCP server:", err);
  process.exit(1);
});
//# sourceMappingURL=index.js.map