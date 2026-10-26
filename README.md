<p align="center">
  <a href="https://aliasmail.space/">
    <img src="https://aliasmail.space/logo.png" alt="AliasMail Logo" width="140" height="auto" />
  </a>
</p>

<h1 align="center">AliasMail MCP Server</h1>

<p align="center">
  <strong>The Official Model Context Protocol (MCP) Server for <a href="https://aliasmail.space/">AliasMail.space</a></strong><br>
  Instant, zero-log disposable email inboxes, autonomous OTP / verification code extraction, and deep email security tools for AI agents.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/aliasmail-mcp"><img src="https://img.shields.io/npm/v/aliasmail-mcp.svg?style=flat-square&color=indigo" alt="npm version" /></a>
  <a href="https://github.com/anshu4sharma/aliasmail-mcp/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="MIT License" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-Certified-emerald.svg?style=flat-square" alt="Model Context Protocol" /></a>
  <a href="https://aliasmail.space/"><img src="https://img.shields.io/badge/Privacy-Zero--Log-purple.svg?style=flat-square" alt="Zero Log" /></a>
  <a href="https://aliasmail.space/temporary/"><img src="https://img.shields.io/badge/Web_Inbox-aliasmail.space-blue?style=flat-square" alt="Web Inbox" /></a>
</p>

---

## ⚡ What is AliasMail MCP?

Autonomous AI coding agents (Claude Desktop, Cursor, Antigravity, Windsurf, AutoGPT, Playwright agents) constantly need to sign up for accounts, run end-to-end integration tests, and verify email workflows.

Historically, this required manually signing up for third-party email APIs, creating credit card accounts, or writing fragile regexes to poll temporary mail inboxes.

**AliasMail MCP** connects any MCP-compliant AI assistant directly to **[AliasMail.space](https://aliasmail.space/)**'s zero-log edge routing infrastructure:
1. **Generate Instant Burner Inboxes**: Create disposable email addresses (`*@aliasmail.space`) in 1 millisecond without an API key or registration.
2. **Autonomous Verification & OTP Extraction**: The `aliasmail_wait_for_code` tool polls until an incoming email arrives and automatically extracts 4–8 digit verification codes and magic confirmation links.
3. **Email Security Suite**: Deep RFC 822 header inspection, spam score calculation, disposable domain detection, tracking pixel neutralization, and DNS MX/SPF/DMARC auditing.

---

## 🚀 Quickstart & Installation

### Option 1: Run with `npx` (No installation needed)

```bash
npx -y aliasmail-mcp
```

---

### Option 2: Add to Claude Desktop

Open your Claude Desktop configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Add `aliasmail` to your `mcpServers`:

```json
{
  "mcpServers": {
    "aliasmail": {
      "command": "npx",
      "args": ["-y", "aliasmail-mcp"]
    }
  }
}
```

Restart Claude Desktop, and you'll see the AliasMail tools icon ready in your prompt window!

---

### Option 3: Add to Cursor IDE

Add to your project's `.cursor/mcp.json` or your global Cursor settings:

```json
{
  "mcpServers": {
    "aliasmail": {
      "command": "npx",
      "args": ["-y", "aliasmail-mcp"]
    }
  }
}
```

---

### Option 4: Add to Windsurf

In your Windsurf MCP configuration (`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "aliasmail": {
      "command": "npx",
      "args": ["-y", "aliasmail-mcp"]
    }
  }
}
```

---

### Option 5: Install via Smithery

If you use [Smithery.ai](https://smithery.ai/):

```bash
npx -y @smithery/cli install aliasmail-mcp --client claude
```

---

## 🛠️ Available MCP Tools

### 📬 Disposable & Temporary Inbox Tools

| Tool | Description |
|---|---|
| `aliasmail_create_inbox` | Generates a fresh, zero-log temporary email inbox (e.g. `lunarbyte492@aliasmail.space`) or custom handle. Returns email and web inbox URL. |
| `aliasmail_wait_for_code` | **Autonomous Agent Power Tool**: Polls until an email arrives and automatically extracts the numerical OTP verification code or activation link. |
| `aliasmail_get_messages` | Fetches all received messages in an inbox with sender, subject, timestamp, and snippet. |
| `aliasmail_get_message` | Retrieves the full plain text, clean sanitized HTML, headers, and detected links for a specific email. |
| `aliasmail_wait_for_email` | Waits for any incoming message matching optional sender or subject filters. |

### 🛡️ Email Forensics & Security Tools

| Tool | Description |
|---|---|
| `aliasmail_validate_email` | Validates RFC 5322 syntax, live domain MX records, typo domains (e.g. `gmial.com`), and disposable mailbox detection. |
| `aliasmail_check_disposable` | Inspects whether any email or domain belongs to an ephemeral burner service or legitimate corporate MX. |
| `aliasmail_check_spam_score` | Scans email subject and body against 5 spam trigger categories and calculates a 0–100 deliverability score. |
| `aliasmail_analyze_headers` | Parses RFC 822 headers: SPF, DKIM, DMARC verdicts, hop relay transit timeline, and origin IP. |
| `aliasmail_clean_tracking` | Defuses invisible 1x1 tracking pixels, read receipt beacons, and surveillance redirect links. |
| `aliasmail_check_dns` | Real-time DNS audit of domain Mail Exchange (MX) records, SPF syntax, and DMARC enforcement. |
| `aliasmail_health_check` | Checks live availability and status of AliasMail edge relay infrastructure. |

---

## 🤖 Example Agent Workflows

### 1. Autonomous Signup & Email Verification
Give this instruction to your AI agent (Cursor / Claude / Antigravity):

> *"Sign up for a test account on example.com. Use an AliasMail temporary email inbox, submit the form, and wait for the verification code using `aliasmail_wait_for_code` to enter it automatically."*

The agent will:
1. Call `aliasmail_create_inbox` ➔ receives `swiftfox309@aliasmail.space`
2. Fill the registration form with `swiftfox309@aliasmail.space`
3. Call `aliasmail_wait_for_code({ address: "swiftfox309@aliasmail.space" })`
4. Receive `{ code: "748291", primaryUrl: "https://example.com/verify?token=..." }`
5. Finish authentication seamlessly without human intervention.

---

### 2. Inspecting Spam & Tracking Pixels
> *"Analyze this marketing email HTML for spy trackers and test its deliverability score."*

The agent calls:
1. `aliasmail_clean_tracking` to neutralize tracking pixels.
2. `aliasmail_check_spam_score` to optimize email copy.

---

## 🌐 Live Web Interface

Want to view emails manually in your browser? Every inbox created by this MCP server is immediately accessible on the web:
- **Instant Web Inbox**: [https://aliasmail.space/temporary/](https://aliasmail.space/temporary/)
- **Main Platform & Permanent Aliases**: [https://aliasmail.space/](https://aliasmail.space/)
- **Free Email Security Tools**: [https://aliasmail.space/tools/](https://aliasmail.space/tools/)

---

## 🔒 Zero-Log Architecture & Privacy

AliasMail is engineered with a strict privacy-first foundation:
- **Zero IP logging**: We never log agent or client IP addresses.
- **Automatic TTL Expiration**: Ephemeral messages are held in high-speed edge queues and purged automatically.
- **Edge Routing**: Powered by Cloudflare Email Routing and BullMQ processing for sub-second delivery.

---

## 📄 License

MIT © [Anshu Sharma](https://github.com/anshu4sharma) & [AliasMail.space](https://aliasmail.space)
