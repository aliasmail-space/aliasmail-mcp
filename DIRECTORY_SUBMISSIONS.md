# 🚀 AliasMail MCP — Public Distribution & Growth Playbook

This document contains ready-to-submit Pull Requests, registry submission forms, and launch posts to get **AliasMail MCP** featured across the top Model Context Protocol registries, awesome lists, and developer communities to drive massive organic traffic back to **[https://aliasmail.space/](https://aliasmail.space/)**.

---

## 📋 Step 0: Push Repository to GitHub

Before submitting PRs, push the repository to GitHub under your account or organization:

```bash
cd /home/anshu/Desktop/aliasmail-mcp

# 1. Initialize git (if not already done)
git init
git add .
git commit -m "feat: initial release of aliasmail-mcp server"

# 2. Create public GitHub repository and push
gh repo create anshu4sharma/aliasmail-mcp --public --source=. --remote=origin --push

# (Or if using aliasmailonline org):
# gh repo create aliasmailonline/aliasmail-mcp --public --source=. --remote=origin --push
```

### (Optional) Publish to npm for 1-Click `npx aliasmail-mcp`

```bash
npm login
npm publish --access public
```

---

## 🌟 1. Submit to `punkpeye/awesome-mcp-servers`
*The #1 most starred MCP list on GitHub (Over 10,000+ stars, high developer traffic).*

- **Repository**: [https://github.com/punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
- **File to Edit**: `README.md`
- **Section**: `### 📨 Communication` or `### 🛠️ Utilities` or `### 🧪 Testing`

### PR Title:
```
Add AliasMail MCP server for disposable emails & OTP extraction
```

### Markdown Entry to Insert:
```markdown
- [AliasMail](https://github.com/anshu4sharma/aliasmail-mcp) - Zero-log disposable temporary inboxes, autonomous OTP & verification code extraction, and deep email forensics powered by [AliasMail.space](https://aliasmail.space).
```

---

## 🌟 2. Submit to `modelcontextprotocol/servers`
*Anthropic's official directory repository.*

- **Repository**: [https://github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
- **File to Edit**: `README.md` or Community Servers section.

### PR Description:
```markdown
### Summary
This PR adds the official **AliasMail MCP Server** to the community servers listing.

### Features
- Instant, zero-log ephemeral burner inboxes (`*@aliasmail.space`).
- Autonomous AI agent OTP & verification link extraction (`aliasmail_wait_for_code`).
- Email forensics suite: spam score check, RFC 822 header inspection, tracking pixel neutralization, and DNS MX/SPF/DMARC audit.

- **Repository**: https://github.com/anshu4sharma/aliasmail-mcp
- **Website**: https://aliasmail.space/
- **License**: MIT
```

---

## 🌟 3. Submit to `wong2/awesome-mcp-servers`
*Another prominent MCP community index.*

- **Repository**: [https://github.com/wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers)
- **File to Edit**: `README.md` under `Email / Communication`

### Markdown Entry:
```markdown
- [anshu4sharma/aliasmail-mcp](https://github.com/anshu4sharma/aliasmail-mcp) - Temporary email inboxes, automated OTP code extraction for AI agents, and email privacy tools by [AliasMail](https://aliasmail.space).
```

---

## 🌟 4. Publish to Smithery.ai (1-Click Install for Claude Desktop)
*The leading web registry for MCP servers.*

1. We have already created `smithery.yaml` in this repository.
2. Go to: [https://smithery.ai/new](https://smithery.ai/new)
3. Paste your GitHub repository URL: `https://github.com/anshu4sharma/aliasmail-mcp`
4. Click **Publish**.
5. Smithery will automatically index the server, generate a listing page with backlinks to `https://aliasmail.space/`, and allow users to install it with:
   ```bash
   npx -y @smithery/cli install aliasmail-mcp --client claude
   ```

---

## 🌟 5. Submit to Glama.ai MCP Registry
*Fast-growing MCP discovery platform.*

1. Visit [https://glama.ai/mcp/servers](https://glama.ai/mcp/servers)
2. Click **Submit a Server**.
3. Input:
   - **Name**: AliasMail MCP
   - **GitHub Repo**: `https://github.com/anshu4sharma/aliasmail-mcp`
   - **Category**: Utilities / Developer Tools
   - **Website**: `https://aliasmail.space/`
   - **Description**: Zero-log disposable temporary email inboxes, autonomous OTP / verification code extraction, and email forensics suite for AI coding agents.

---

## 🌟 6. Submit to PulseMCP Directory
*Curated directory of top MCP integrations.*

1. Visit [https://www.pulsemcp.com/submit](https://www.pulsemcp.com/submit)
2. Submit repository link and project description with backlink to `https://aliasmail.space/`.

---

## 📢 7. Community Launch Posts (Hacker News & Reddit)

### Hacker News (Show HN):
**URL**: [https://news.ycombinator.com/submit](https://news.ycombinator.com/submit)
**Title**:
```
Show HN: AliasMail MCP – Disposable inboxes & autonomous OTP extraction for AI agents
```
**Body**:
```text
Hey HN!

When building autonomous AI agents (in Claude, Cursor, Antigravity, or Playwright), one recurring friction point is email verification: signing up for test accounts, confirming emails, or extracting 6-digit OTP codes usually requires setting up paid email APIs or complex IMAP polling.

We built an open-source MCP server for AliasMail (https://aliasmail.space/):

- Instant disposable burner inboxes (*@aliasmail.space) with zero registration.
- A dedicated `aliasmail_wait_for_code` tool that polls until an email arrives and automatically parses out the 4-8 digit OTP code and verification links.
- Email forensics tools: spam score rating, tracking pixel stripper, and SPF/DKIM header checks.
- Zero-log architecture powered by Cloudflare edge email routing.

GitHub: https://github.com/anshu4sharma/aliasmail-mcp
Web App: https://aliasmail.space/temporary/

Try it directly with:
npx -y aliasmail-mcp

Feedback and PRs welcome!
```

---

### Reddit (Post to r/mcp, r/ClaudeAI, r/LocalLLaMA, r/selfhosted):
**Title**:
```
I built a free MCP server for Claude and Cursor that generates disposable emails and auto-extracts verification OTP codes
```
**Post**:
```text
Hey everyone!

If you use Claude Desktop, Cursor, or any MCP-enabled agent to automate web tasks, signups, or integration testing, you probably know how painful email verification workflows are.

I created AliasMail MCP (https://github.com/anshu4sharma/aliasmail-mcp) powered by https://aliasmail.space/.

Key features:
1. Generate temporary emails in 1 millisecond (no API keys, zero signup).
2. Autonomous OTP extractor: `aliasmail_wait_for_code` polls the inbox and parses out 6-digit OTPs and magic confirmation links so agents can finish signups on their own.
3. Free email tools: inspect headers, spam score analyzer, and tracking pixel stripper.

You can run it in 5 seconds without installing anything:

In your claude_desktop_config.json:
{
  "mcpServers": {
    "aliasmail": {
      "command": "npx",
      "args": ["-y", "aliasmail-mcp"]
    }
  }
}

Check it out on GitHub: https://github.com/anshu4sharma/aliasmail-mcp
Web interface: https://aliasmail.space/
```
