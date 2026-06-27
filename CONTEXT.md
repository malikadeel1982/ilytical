# Ilytical — Project Context File
> Share this file at the start of every new chat to resume instantly.
> Update it as the project evolves.

---

## App Overview
**Ilytical** — AI-powered beverage shelf analysis tool built for Core9 Ventures.
Analyzes photos of beverage stock using Google Gemini AI.

---

## Live URLs
- **Frontend:** *(add your Vercel URL here)*
- **Backend:** https://ilytical-api.onrender.com
- **GitHub:** https://github.com/malikadeel1982/ilytical

---

## Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| AI | Google Gemini (gemini-3.5-flash) via @google/genai SDK v1 |
| File upload | multer v2 (memoryStorage) |
| Frontend hosting | Vercel |
| Backend hosting | Render (free tier — 50s cold start) |
| Source control | GitHub |

---

## Project Structure
```
E:\Ilytical\
├── client/                  # React frontend (Vercel)
│   ├── src/
│   │   ├── App.jsx          # Main app, auth, theme, form, webcam
│   │   ├── App.css          # Full theme system (light + dark)
│   │   ├── ResultsModal.jsx # Bottom-sheet results popup
│   │   ├── LoginScreen.jsx  # Login UI
│   │   ├── LoginScreen.css
│   │   └── beverageConfig.js # BRANDS and CONTAINER_TYPES arrays
│   ├── public/
│   │   └── core9-logo.svg
│   ├── index.html
│   └── vite.config.js       # Proxies /api → localhost:3001 in dev
├── server/
│   └── index.js             # Express API, Gemini calls, CORS
└── CONTEXT.md               # This file
```

---

## Design System
- **Primary color:** `#52318A` (purple)
- **Dark mode accent:** `#9b6dd6`
- **Font:** Inter (Google Fonts)
- **Theme:** CSS custom properties, toggled via `data-theme="dark"` on `<html>`
- **Logo:** Core9 SVG in topbar and login screen

---

## Features (v1.0 — Live)
- [x] Login screen (admin / admin123)
- [x] Light / dark mode toggle
- [x] Upload image or use webcam
- [x] Select brand (Pepsi, Coca-Cola, Fanta, Mirinda, Kina Cola)
- [x] Select container type (Can, Bottle)
- [x] Two analysis modes:
  - **Stock Counting** — total unit count, confidence, notes
  - **Share Of Shelf (SOS)** — per-shelf breakdown, facing %, total shelves
- [x] Results shown in bottom-sheet modal
- [x] Cold-start warning banner (appears after 4s)
- [x] Logout button

---

## Environment Variables
**Server (Render):**
- `GEMINI_API_KEY` — Google Gemini API key

**Client (Vercel):**
- `VITE_API_URL` — https://ilytical-api.onrender.com

---

## Key Technical Notes
- `multer v2`: use `const { memoryStorage } = require("multer")` (default export removed)
- Gemini response: use `response.text` (not `.candidates[0]...`)
- Gemini config key: `config: { responseMimeType: "application/json" }` (not `generationConfig`)
- Dark mode: JS must directly set `root.style.background` + `document.body.style.background` — CSS vars alone don't cover full page
- Auth persisted in `localStorage` key `"ilytical_auth"` = `"1"`
- CORS allows `/^http:\/\/localhost/` and `/\.vercel\.app$/`

---

## Planned Features (Backlog)
- [ ] v1.1 — Scan history (local storage)
- [ ] v1.2 — Export results as PDF/CSV
- [ ] v1.3 — Competitor brand detection
- [ ] v1.4 — Real auth with database (multi-user)
- [ ] v1.5 — Dashboard with charts and trends
- [ ] v1.6 — GPS/store tagging per scan
- [ ] v1.7 — Offline mode (PWA)

---

## Version History
| Version | Date | What changed |
|---------|------|--------------|
| v1.0 | 2026-06-27 | Initial launch — stock count + SOS analysis, login, dark mode, deployed |

---

## How to Run Locally
```
# Terminal 1 — Backend
cd E:\Ilytical\server
npm run dev

# Terminal 2 — Frontend
cd E:\Ilytical\client
npm run dev
```
Frontend: http://localhost:5173
Backend: http://localhost:3001
