# Peekaboo

**What your design is hiding.**

Peekaboo is an accessibility scanner for product designers. Paste a Figma file URL and get a screen-by-screen report checking every screen against WCAG 2.1 AA and ADA standards — no dev tools, no manual auditing.

🔗 **Live app: https://peekaboo-navy.vercel.app/**

---

## What it checks

- **Color contrast** — WCAG 2.1 AA requires 4.5:1 for normal text, 3:1 for large text
- **Tap target sizes** — minimum 44×44pt following Apple's iOS HIG
- **Text sizing** — minimum 11pt with dynamic type support

---

## How it works

1. Paste your Figma file URL into Peekaboo
2. Enter your Figma personal access token (stored locally, never sent to any server)
3. Peekaboo scans every visible screen across all pages
4. Get a screen-by-screen report with pass/fail per element and specific fix suggestions

---

## Required Figma token scopes

When generating your Figma personal access token, only enable:
- `file_content:read` — reads file content and renders frame thumbnails

No write permissions needed. Peekaboo never modifies your Figma files.

Set the expiration to 30 days or longer so your token doesn't expire frequently.

---

## Running locally
```bash
npm install
npm run dev
```

Open http://localhost:5173 and enter your Figma token when prompted.

---

## Tech stack

React 19 · Vite · Tailwind CSS · shadcn/ui · Figma REST API

---

## Built by

Kerwin Chen — designed and built with Claude.
