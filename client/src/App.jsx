import React, { useState, useRef, useEffect } from "react";
import { BRANDS, CONTAINER_TYPES } from "./beverageConfig";
import ResultsModal from "./ResultsModal";
import LoginScreen from "./LoginScreen";
import "./App.css";

const MODES = [
  { id: "stock_count",    label: "Stock Counting" },
  { id: "share_of_shelf", label: "Share Of Shelf (SOS)" },
];

export default function App() {
  // --- Auth — persisted in localStorage so refresh keeps you logged in ---
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem("ilytical_auth") === "1");

  function handleLogin() {
    localStorage.setItem("ilytical_auth", "1");
    setLoggedIn(true);
  }

  function handleLogout() {
    localStorage.removeItem("ilytical_auth");
    setLoggedIn(false);
  }

  // --- Theme ---
  const [theme, setTheme] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    // Force background on both html and body so the full page switches — not just the card
    const bg = theme === "dark" ? "#0e0a17" : "#f5f2fa";
    root.style.background = bg;
    document.body.style.background = bg;
  }, [theme]);
  function toggleTheme() { setTheme((t) => (t === "dark" ? "light" : "dark")); }

  // --- Form state ---
  // Set of selected mode IDs — user can pick one or both
  const [modes, setModes] = useState(new Set(["stock_count"]));

  function toggleMode(id) {
    setModes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [brand, setBrand] = useState("");
  const [containerType, setContainerType] = useState("");
  const [loading, setLoading] = useState(false);
  const [slowServer, setSlowServer] = useState(false); // cold-start warning
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // --- Webcam state ---
  const [showWebcam, setShowWebcam] = useState(false);
  const [stream, setStream] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  async function openWebcam() {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream);
      setShowWebcam(true);
    } catch {
      setError("Camera access denied. Use file upload instead.");
    }
  }

  useEffect(() => {
    if (showWebcam && videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [showWebcam, stream]);

  function stopWebcam() {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setShowWebcam(false);
  }

  function captureSnapshot() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], "webcam-capture.jpg", { type: "image/jpeg" });
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      setResult(null);
      stopWebcam();
    }, "image/jpeg", 0.92);
  }

  // If shelf-share or both selected → full analysis; otherwise stock count only
  const apiMode = modes.has("share_of_shelf") ? "share_of_shelf" : "stock_count";
  const canSubmit = imageFile && brand && containerType && modes.size > 0;

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!imageFile || !brand || !containerType) return;
    setLoading(true);
    setSlowServer(false);
    setResult(null);
    setError(null);
    setShowModal(false);

    // If the server hasn't responded in 4 seconds, show the cold-start warning
    const slowTimer = setTimeout(() => setSlowServer(true), 4000);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("brand", brand);
      formData.append("containerType", containerType);
      formData.append("mode", apiMode);
      // In dev, Vite proxies /api to localhost:3001.
      // In production, VITE_API_URL points to the live Render backend.
      const base = import.meta.env.VITE_API_URL ?? "";
      const response = await fetch(`${base}/api/analyze`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Server error (${response.status})`);
      setResult(data);
      setShowModal(true);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      clearTimeout(slowTimer);
      setSlowServer(false);
      setLoading(false);
    }
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Show login screen if not authenticated
  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="app">

      {/* ---- Top bar ---- */}
      <div className="topbar">
        <img src="/core9-logo.svg" alt="Core9" className="core9-logo" />
        <div className="topbar-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button className="logout-btn" onClick={handleLogout} aria-label="Logout" title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* ---- Hero header ---- */}
      <div className="app-header">
        <h1 className="app-title">Ilytical</h1>
        <p className="subtitle">AI-Powered Image Analysis</p>
      </div>

      <main className="app-main">
        <form className="card" onSubmit={handleSubmit}>

          {/* ---- Mode selector ---- */}
          <section>
            <span className="step-pill"><span className="step-num">1</span> Analysis Type</span>
            <div className="mode-list" style={{ marginTop: "0.75rem" }}>
              {MODES.map((m) => (
                <label key={m.id} className={`mode-checkbox${modes.has(m.id) ? " mode-checkbox--active" : ""}`}>
                  <input
                    type="checkbox"
                    checked={modes.has(m.id)}
                    onChange={() => toggleMode(m.id)}
                  />
                  <span className="mode-checkbox-label">{m.label}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="divider" />

          {/* ---- Photo ---- */}
          <section>
            <span className="step-pill"><span className="step-num">2</span> Photo</span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />

            <div className="btn-row" style={{ marginTop: "0.75rem" }}>
              <button type="button" className="btn btn-icon" onClick={() => fileInputRef.current?.click()} title="Upload file" aria-label="Upload file">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </button>
              <button type="button" className="btn btn-icon" onClick={openWebcam} title="Use webcam" aria-label="Use webcam">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              </button>
            </div>

            {showWebcam && (
              <div className="webcam-wrap" style={{ marginTop: "0.75rem" }}>
                <video ref={videoRef} autoPlay playsInline className="webcam-video" />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <div className="webcam-actions">
                  <button type="button" className="btn btn-primary" onClick={captureSnapshot}>📸 Take Photo</button>
                  <button type="button" className="btn btn-outline" onClick={stopWebcam}>Cancel</button>
                </div>
              </div>
            )}

            {previewUrl && !showWebcam && (
              <div className="preview-wrap" style={{ marginTop: "0.75rem" }}>
                <img src={previewUrl} alt="Preview" className="preview-img" />
                <div className="preview-info">
                  <span className="preview-name">{imageFile?.name}</span>
                  <span className="preview-size">{formatFileSize(imageFile?.size ?? 0)}</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: "0.78rem", fontWeight: 600, padding: 0, textAlign: "left" }}
                  >
                    Change →
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="divider" />

          {/* ---- Brand ---- */}
          <section>
            <span className="step-pill"><span className="step-num">3</span> Brand</span>
            <select className="select" style={{ marginTop: "0.75rem" }} value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="">— Choose a brand —</option>
              {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </section>

          <div className="divider" />

          {/* ---- Container ---- */}
          <section>
            <span className="step-pill"><span className="step-num">4</span> Container</span>
            <select className="select" style={{ marginTop: "0.75rem" }} value={containerType} onChange={(e) => setContainerType(e.target.value)}>
              <option value="">— Choose a type —</option>
              {CONTAINER_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </section>

          <div className="divider" />

          {/* ---- Submit ---- */}
          <button type="submit" className="btn btn-primary" disabled={!canSubmit || loading}>
            {loading
              ? <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                  <span className="btn-spinner" /> Analyzing…
                </span>
              : canSubmit ? "Analyze ✦" : "Fill in all fields to continue"}
          </button>

          {/* Cold-start warning — appears after 4s if server is still waking up */}
          {slowServer && loading && (
            <div className="cold-start-banner">
              <span className="cold-icon">⏳</span>
              <div>
                <p className="cold-title">Server is waking up…</p>
                <p className="cold-sub">This can take up to 30 seconds on first use. Please wait.</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="inline-error"><span>⚠️</span> {error}</div>
          )}

          {result && !showModal && !loading && (
            <button type="button" className="btn btn-outline" onClick={() => setShowModal(true)}>
              📋 View Last Results
            </button>
          )}
        </form>
      </main>

      {/* ---- Results modal ---- */}
      {showModal && result && (
        <ResultsModal
          result={result}
          brand={brand}
          containerType={containerType}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
