# Beverage Stock Counter

Take a photo of stacked beverage stock, pick a brand and container type, and let Google Gemini count how many are visible.

## Project structure

```
Ilytical/
├── server/   ← Node.js + Express API
└── client/   ← React + Vite frontend
```

---

## 1. Add your Gemini API key

1. Go to https://aistudio.google.com/app/apikey and create a free key.
2. Inside the `server/` folder, copy `.env.example` to `.env`:

   ```
   cd server
   copy .env.example .env      # Windows
   # or: cp .env.example .env  # Mac/Linux
   ```

3. Open `server/.env` and replace `your_gemini_api_key_here` with your real key:

   ```
   GEMINI_API_KEY=AIza...
   ```

   > **Important:** `.env` is listed in `.gitignore` and will never be committed.

---

## 2. Install dependencies

Open **two terminals** (one for the server, one for the client).

**Terminal 1 — backend:**
```bash
cd server
npm install
```

**Terminal 2 — frontend:**
```bash
cd client
npm install
```

---

## 3. Run in development

**Terminal 1 — start the backend (port 3001):**
```bash
cd server
npm run dev
```

**Terminal 2 — start the frontend (port 5173):**
```bash
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

The Vite dev server proxies `/api` requests to `http://localhost:3001`, so you never need to hard-code the backend URL in the frontend.

---

## Adding more brands or container types

Edit `client/src/beverageConfig.js` — it's the single source of truth for both dropdowns:

```js
export const BRANDS = ["Pepsi", "Coca-Cola", "Fanta", "Mirinda", "7-Up"]; // ← add here

export const CONTAINER_TYPES = ["Can", "Bottle", "Carton"]; // ← add here
```

No other file needs to change.
