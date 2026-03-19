# Peekaboo

**Can your users see your UI?**

Peekaboo scans Figma mobile designs for WCAG 2.1 AA and ADA accessibility issues — color contrast ratios, tap target sizes, and text sizing — and generates a per-screen report with actionable fixes.

## Features

- Color contrast analysis (WCAG 2.1 AA / AAA)
- Tap target size checks (44×44pt minimum)
- Text size checks (11pt minimum)
- Per-screen accessibility score
- Figma node thumbnails for failed checks
- Grouped by Figma page

## Getting Started

1. Copy `.env.example` to `.env` and add your Figma personal access token:
   ```
   VITE_FIGMA_TOKEN=your_token_here
   ```

2. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```

3. Paste a Figma file URL and click **Scan**.

## Tech Stack

React 19 · Vite · Tailwind CSS · Figma REST API
