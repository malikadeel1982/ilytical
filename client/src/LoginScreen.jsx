import React, { useState } from "react";
import "./LoginScreen.css";

// Hard-coded test credentials — replace with real auth later
const VALID_USER = "admin";
const VALID_PASS = "admin123";

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Small delay so it feels like a real check
    setTimeout(() => {
      if (username.trim() === VALID_USER && password === VALID_PASS) {
        onLogin();
      } else {
        setError("Incorrect username or password.");
      }
      setLoading(false);
    }, 500);
  }

  const canLogin = username.trim() && password;

  return (
    <div className="ls-page">
      <div className="ls-card">

        {/* Logo */}
        <div className="ls-logo-wrap">
          <img src="/core9-logo.svg" alt="Core9" className="ls-logo" />
        </div>

        {/* App name */}
        <h1 className="ls-app-name">Ilytical</h1>
        <p className="ls-app-sub">AI-Powered Image Analysis</p>

        {/* Form */}
        <form className="ls-form" onSubmit={handleSubmit} autoComplete="off">

          <div className="ls-field">
            <label className="ls-label" htmlFor="ls-user">Username</label>
            <input
              id="ls-user"
              type="text"
              className="ls-input"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="ls-field">
            <label className="ls-label" htmlFor="ls-pass">Password</label>
            <div className="ls-input-wrap">
              <input
                id="ls-pass"
                type={showPass ? "text" : "password"}
                className="ls-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="ls-eye"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && <p className="ls-error">⚠️ {error}</p>}

          <button
            type="submit"
            className="ls-btn"
            disabled={!canLogin || loading}
          >
            {loading ? <span className="ls-spinner" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
